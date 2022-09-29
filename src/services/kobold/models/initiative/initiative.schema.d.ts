/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * A  character
 */
export interface Initiative {
	/**
	 * The id of the initiative.
	 */
	id?: number;
	/**
	 * The id of the channel initiative is taking place in.
	 */
	channelId?: string;
	/**
	 * The discord id of the user who started the initiative
	 */
	gmUserId?: string;
	/**
	 * The message ids for the header of the most recent round. Ordered by round #.
	 */
	roundMessageIds?: string[];
	/**
	 * The current round number
	 */
	currentRound?: number;
	/**
	 * The current initiative value
	 */
	currentInitiative?: number | null;
	/**
	 * When the initiative was first started
	 */
	createdAt?: string;
	/**
	 * When the initiative was last interacted with
	 */
	lastUpdatedAt?: string;
	[k: string]: any;
}