import { InitiativeActorGroup } from './../../../services/kobold/models/initiative-actor-group/initiative-actor-group.model';
import { InitiativeUtils, InitiativeBuilder } from './../../../utils/initiative-utils';
import { InitiativeActor } from '../../../services/kobold/models/initiative-actor/initiative-actor.model';
import { ChatArgs } from '../../../constants/chat-args';
import {
	ApplicationCommandType,
	RESTPostAPIChatInputApplicationCommandsJSONBody,
	ChatInputCommandInteraction,
	PermissionsString,
	EmbedBuilder,
	AutocompleteFocusedOption,
	AutocompleteInteraction,
	CacheType,
	ApplicationCommandOptionChoiceData,
} from 'discord.js';
import { RateLimiter } from 'discord.js-rate-limiter';

import { EventData } from '../../../models/internal-models.js';
import { InteractionUtils } from '../../../utils/index.js';
import { Command, CommandDeferType } from '../../index.js';
import _ from 'lodash';
import { KoboldEmbed } from '../../../utils/kobold-embed-utils.js';
import { TranslationFunctions } from '../../../i18n/i18n-types.js';
import { Language } from '../../../models/enum-helpers/index.js';

export class InitSetSubCommand implements Command {
	public names = [Language.LL.commands.init.set.name()];
	public metadata: RESTPostAPIChatInputApplicationCommandsJSONBody = {
		type: ApplicationCommandType.ChatInput,
		name: Language.LL.commands.init.set.name(),
		description: Language.LL.commands.init.set.description(),
		dm_permission: true,
		default_member_permissions: undefined,
	};
	public cooldown = new RateLimiter(1, 5000);
	public deferType = CommandDeferType.PUBLIC;
	public requireClientPerms: PermissionsString[] = [];

	public async autocomplete(
		intr: AutocompleteInteraction<CacheType>,
		option: AutocompleteFocusedOption
	): Promise<ApplicationCommandOptionChoiceData[]> {
		if (!intr.isAutocomplete()) return;
		if (option.name === ChatArgs.INIT_CHARACTER_OPTION.name) {
			//we don't need to autocomplete if we're just dealing with whitespace
			const match = intr.options.getString(ChatArgs.INIT_CHARACTER_OPTION.name);

			const currentInitResponse = await InitiativeUtils.getInitiativeForChannel(intr.channel);
			if (currentInitResponse.errorMessage) {
				return [];
			}
			//get the actor matches
			let actorOptions = InitiativeUtils.getControllableInitiativeActors(
				currentInitResponse.init,
				intr.user.id
			);
			actorOptions = actorOptions.filter(actor => actor.name.includes(match));

			//return the matched actors
			return actorOptions.map(actor => ({
				name: actor.name,
				value: actor.name,
			}));
		}
	}

	public async execute(
		intr: ChatInputCommandInteraction,
		data: EventData,
		LL: TranslationFunctions
	): Promise<void> {
		const targetCharacterName = intr.options
			.getString(ChatArgs.INIT_CHARACTER_OPTION.name)
			.trim();
		const fieldToChange = intr.options.getString(ChatArgs.ACTOR_SET_OPTION.name).trim();
		const newFieldValue = intr.options.getString(ChatArgs.ACTOR_SET_VALUE_OPTION.name).trim();

		if (!fieldToChange || !['initiative', 'name'].includes(fieldToChange)) {
			await InteractionUtils.send(
				intr,
				LL.commands.init.set.interactions.invalidOptionError()
			);
			return;
		}
		let currentInitResponse = await InitiativeUtils.getInitiativeForChannel(intr.channel, {
			sendErrors: true,
			LL,
		});
		if (currentInitResponse.errorMessage) {
			await InteractionUtils.send(intr, currentInitResponse.errorMessage);
			return;
		}
		let currentInit = currentInitResponse.init;

		const actorResponse: { actor: InitiativeActor; errorMessage: string } =
			await InitiativeUtils.getNameMatchActorFromInitiative(
				intr.user.id,
				currentInit,
				targetCharacterName,
				LL
			);
		if (actorResponse.errorMessage) {
			await InteractionUtils.send(intr, actorResponse.errorMessage);
			return;
		}
		const actor = actorResponse.actor;
		const actorsInGroup = _.filter(
			currentInit.actors,
			possibleActor => possibleActor.initiativeActorGroupId === actor.initiativeActorGroupId
		);

		// validate the updates
		if (fieldToChange === targetCharacterName) {
			//a name can't be an empty string
			if (newFieldValue === '') {
				await InteractionUtils.send(
					intr,
					LL.commands.init.set.interactions.emptyNameError()
				);
				return;
				//a name can't already be in the initiative
			} else if (
				currentInit.actors.find(
					actor => actor.name.toLowerCase() === newFieldValue.toLowerCase()
				)
			) {
				await InteractionUtils.send(
					intr,
					LL.commands.init.set.interactions.nameExistsError()
				);
				return;
			}
		}

		if (fieldToChange === 'initiative') {
			if (isNaN(Number(newFieldValue))) {
				await InteractionUtils.send(
					intr,
					LL.commands.init.set.interactions.initNotNumberError()
				);
				return;
			}
		}

		// perform the updates
		if (fieldToChange === 'initiative') {
			await InitiativeActorGroup.query().patchAndFetchById(actor.initiativeActorGroupId, {
				initiativeResult: Number(newFieldValue),
			});
		} else if (fieldToChange === 'name') {
			await InitiativeActor.query().patchAndFetchById(actor.id, { name: newFieldValue });
			if (actorsInGroup.length === 1) {
				await InitiativeActorGroup.query().patchAndFetchById(actor.initiativeActorGroupId, {
					name: newFieldValue,
				});
			}
		}
		currentInitResponse = await InitiativeUtils.getInitiativeForChannel(intr.channel, {
			sendErrors: true,
			LL,
		});
		if (currentInitResponse.errorMessage) {
			await InteractionUtils.send(intr, currentInitResponse.errorMessage);
			return;
		}
		currentInit = currentInitResponse.init;

		const updateEmbed = new KoboldEmbed();
		updateEmbed.setTitle(
			LL.commands.init.set.interactions.successEmbed.title({
				actorName: actor.name,
				fieldToChange,
				newFieldValue,
			})
		);

		await InteractionUtils.send(intr, updateEmbed);

		const initBuilder = new InitiativeBuilder({
			initiative: currentInit,
			LL,
		});
		if (currentInit.currentRound === 0) {
			await InitiativeUtils.sendNewRoundMessage(intr, initBuilder);
		}
	}
}
