import { sendTemplate, inheritTextMd } from 'akso/lib/notif-template-util';
import { getSignedURLObjectGET } from 'akso/lib/s3';

export default {
	schema: {
		query: null,
		body: {
			type: 'object',
			properties: {
				notifTemplateId: {
					type: 'integer',
					format: 'uint32'
				},
				deleteTemplateOnComplete: {
					type: 'boolean',
					default: false
				},
				magazineId: {
					type: 'integer',
					format: 'uint32',
				},
				editionId: {
					type: 'integer',
					format: 'uint32',
				},
			},
			required: [ 'notifTemplateId' ],
			additionalProperties: false
		},
	},

	run: async function run (req, res) {
		// Make sure the user has the necessary perms
		const templateData = await AKSO.db('notif_templates')
			.where({
				id: req.body.notifTemplateId,
			})
			.whereIn('intent', [
				'newsletter', 'newsletter_magazine'
			])
			.first('org', 'intent');
		if (!templateData) { return res.sendStatus(404); }
		if (!req.hasPermission('notif_templates.read.' + templateData.org)) { return res.sendStatus(403); }
		if (!req.hasPermission('newsletters.' + templateData.org + '.send')) { return res.sendStatus(403); }

		const newsletter = await AKSO.db('newsletters')
			.where('id', req.params.newsletterId)
			.first('org', 'id');
		if (!newsletter) { return res.sendStatus(404); }
		if (newsletter.org !== templateData.org) {
			return res.sendStatus(404);
		}

		if (req.body.deleteTemplateOnComplete && !req.hasPermission('notif_templates.delete.' + templateData.org)) {
			return res.sendStatus(403);
		}

		let editionData;
		if (templateData.intent === 'newsletter_magazine') {
			if (!('magazineId' in req.body && 'editionId' in req.body)) {
				return res.status(400).type('text/plain')
					.send('magazineId and editionId are required for intent = newsletter_magazine');
			}
			editionData = await AKSO.db('magazines_editions AS e')
				.first(
					'org', 'magazineId', 'e.id AS editionId', 'name', 'm.description AS magazineDescription',
					'e.description AS editionDescription', 'issn', 'idHuman', 'date', 'thumbnailS3Id')
				.innerJoin('magazines AS m', 'e.magazineId', 'm.id')
				.where({
					magazineId: req.body.magazineId,
					'e.id': req.body.editionId,
				});
			if (!editionData) {
				return res.status(400).type('text/plain')
					.send('unknown edition');
			}
			if (!req.hasPermission('magazines.read.' + editionData.org)) {
				return res.status(403).type('text/plain')
					.send('missing perm magazines.read.<org>');
			}
		} else {
			if ('magazineId' in req.body || 'editionId' in req.body) {
				return res.status(400).type('text/plain')
					.send('magazineId and editionId may only be used for intent = newsletter_magazine');
			}
		}

		// Respond so the client isn't left hanging while we send the newsletter
		res.sendStatus(202);

		let intentData = {};
		if (templateData.intent === 'newsletter_magazine') {
			const tocData = await AKSO.db('magazines_editions_toc')
				.select('page', 'title', 'highlighted')
				.where({
					magazineId: req.body.magazineId,
					editionId: req.body.editionId,
				})
				.orderBy([
					{ column: 'highlighted', order: 'desc' },
					'page',
					'id',
				]);

			let tocMd = '| ---: | --- |';
			const tocTextObj = { hi: [], lo: [] };
			for (const toc of tocData) {
				if (toc.highlighted) {
					tocMd += `\n| **${toc.page}** ... | ${toc.title} |`;
					tocTextObj.hi.push(toc);
				} else {
					tocMd += `\n| ${toc.page} ... | ${toc.title} |`;
					tocTextObj.lo.push(toc);
				}
			}
			tocTextObj.all = [ ...tocTextObj.hi, ...tocTextObj.lo ];
			const tocTextPageLen = tocTextObj.all
				.map(x => x.page.length)
				.reduce((x, y) => Math.max(x, y));
			const tocTextTitleLen = tocTextObj.all
				.map(x => x.page.length)
				.reduce((x, y) => Math.max(x, y));

			let tocText = '';
			for (const [n, toc] of tocTextObj.hi.entries()) {
				if (n !== 0 && tocTextObj.hi.length === n) {
					tocText += '\n';
				}
				tocText += `| ${toc.page.toString().padStart(tocTextPageLen)} ... ${toc.title.padEnd(tocTextTitleLen)} |`;
			}

			let thumbnailURL = null;
			if (editionData.thumbnailS3Id) {
				thumbnailURL = getSignedURLObjectGET({
					key: `magazines-editions-thumbnails-${editionData.thumbnailS3Id}-512`,
					expiresIn: 30 * 24 * 60 * 60, // 1 month
				});
			}

			intentData = {
				'magazine.id': editionData.magazineId,
				'magazine.org': editionData.org,
				'magazine.name': editionData.name,
				'magazine.description': editionData.magazineDescription,
				'magazine.issn': editionData.issn,
				// TODO: All these URLs need to use per-org URLs
				'magazine.magazineURL': 'https://uea.org/revuoj/revuo/' + editionData.magazineId,

				'edition.id': editionData.editionId,
				'edition.idHuman': editionData.idHuman,
				'edition.date': editionData.date,
				'edition.thumbnailURL': thumbnailURL,
				'edition.description': editionData.editionDescription,
				'edition.editionURL': `https://uea.org/revuoj/revuo/${editionData.magazineId}/numero/${editionData.editionId}`,

				'toc.md': tocMd,
				'toc.html': { _akso_safeHtml: true, val: inheritTextMd.render(tocMd) },
				'toc.text': tocText,
			};
		}

		await sendTemplate({
			templateId: req.body.notifTemplateId,
			req: {
				query: {
					filter: {
						$newsletterSubscriptions: {
							id: req.params.newsletterId,
						}
					},
				},
			},
			intentData,
			newsletterId: newsletter.id,
		});

		// Delete the template if necessary
		if (req.body.deleteTemplateOnComplete) {
			await AKSO.db('notif_templates')
				.where('id', req.body.notifTemplateId)
				.delete();
		}
	}
};
