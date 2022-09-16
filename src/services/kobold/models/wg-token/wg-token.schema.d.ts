/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

/**
 * an oauth api token for a wanderer's guide character
 */
export interface WgToken {
	/**
	 * The id of the token request.
	 */
	id?: number;
	/**
	 * The external wanderer's guide character id.
	 */
	charId: number;
	/**
	 * the wanderer's guide oauth access token
	 */
	accessToken: string;
	/**
	 * when the token expires
	 */
	expiresAt: string;
	/**
	 * the rights granted for the character
	 */
	accessRights: string;
	/**
	 * the OAUTH token type
	 */
	tokenType: string;
	[k: string]: any;
}
