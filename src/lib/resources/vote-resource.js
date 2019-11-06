import SimpleResource from './simple-resource';

function stringToFractionOrNumber (str) {
	const bits = str.split('/');
	if (bits.length === 1) { return parseFloat(str, 10); }
	return bits.map(x => parseInt(x, 10));
}

/**
 * A resource representing a vote
 */
class VoteResource extends SimpleResource {
	constructor (obj) {
		super(obj);

		if ('hasStarted' in obj) { obj.hasStarted = !!obj.hasStarted; }
		if ('hasEnded' in obj) { obj.hasEnded = !!obj.hasEnded; }
		if ('isActive' in obj) { obj.isActive = !!obj.isActive; }
		if ('usedTieBreaker' in obj) { obj.usedTieBreaker = !!obj.usedTieBreaker; }
		if ('ballotsSecret' in obj) { obj.ballotsSecret = !!obj.ballotsSecret; }
		if ('blankBallotsLimitInclusive' in obj) { obj.blankBallotsLimitInclusive = !!obj.blankBallotsLimitInclusive; }
		if ('quorumInclusive' in obj) { obj.quorumInclusive = !!obj.quorumInclusive; }
		if ('majorityBallotsInclusive' in obj) { obj.majorityBallotsInclusive = !!obj.majorityBallotsInclusive; }
		if ('majorityVotersInclusive' in obj) { obj.majorityVotersInclusive = !!obj.majorityVotersInclusive; }
		if ('majorityMustReachBoth' in obj) { obj.majorityMustReachBoth = !!obj.majorityMustReachBoth; }
		if ('mentionThresholdInclusive' in obj) { obj.mentionThresholdInclusive = !!obj.mentionThresholdInclusive; }
		if ('publishVoters' in obj) { obj.publishVoters = !!obj.publishVoters; }
		if ('publishVotersPercentage' in obj) { obj.publishVotersPercentage = !!obj.publishVotersPercentage; }

		if ('blankBallotsLimit' in obj) { obj.blankBallotsLimit = stringToFractionOrNumber(obj.blankBallotsLimit); }
		if ('quorum' in obj) { obj.quorum = stringToFractionOrNumber(obj.quorum); }
		if ('majorityBallots' in obj) { obj.majorityBallots = stringToFractionOrNumber(obj.majorityBallots); }
		if ('majorityVoters' in obj) { obj.majorityVoters = stringToFractionOrNumber(obj.majorityVoters); }
		if ('mentionThreshold' in obj) { obj.mentionThreshold = stringToFractionOrNumber(obj.mentionThreshold); }
	}
}

export default VoteResource;
