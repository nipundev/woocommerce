/**
 * External dependencies
 */
import { getSetting } from '@woocommerce/settings';
import { recordEvent } from '@woocommerce/tracks';

/**
 * Internal dependencies
 */
import {
	CoreProfilerStateMachineContext,
	UserProfileEvent,
	BusinessInfoEvent,
	PluginsLearnMoreLinkClicked,
	PluginsInstallationCompletedWithErrorsEvent,
	PluginsInstallationCompletedEvent,
	PluginsInstallationRequestedEvent,
} from '..';
import { POSSIBLY_DEFAULT_STORE_NAMES } from '../pages/BusinessInfo';
import {
	InstalledPlugin,
	PluginInstallError,
} from '../services/installAndActivatePlugins';
import { getPluginTrackKey, getTimeFrame } from '~/utils';

const recordTracksStepViewed = (
	_context: unknown,
	_event: unknown,
	{ action }: { action: unknown }
) => {
	const { step } = action as { step: string };
	recordEvent( 'coreprofiler_step_view', {
		step,
		wc_version: getSetting( 'wcVersion' ),
	} );
};

const recordTracksStepSkipped = (
	_context: unknown,
	_event: unknown,
	{ action }: { action: unknown }
) => {
	const { step } = action as { step: string };
	recordEvent( `coreprofiler_${ step }_skip` );
};

const recordTracksIntroCompleted = () => {
	recordEvent( 'coreprofiler_step_complete', {
		step: 'intro_opt_in',
		wc_version: getSetting( 'wcVersion' ),
	} );
};

const recordTracksUserProfileCompleted = (
	_context: CoreProfilerStateMachineContext,
	event: Extract< UserProfileEvent, { type: 'USER_PROFILE_COMPLETED' } >
) => {
	recordEvent( 'coreprofiler_step_complete', {
		step: 'user_profile',
		wc_version: getSetting( 'wcVersion' ),
	} );

	recordEvent( 'coreprofiler_user_profile', {
		business_choice: event.payload.userProfile.businessChoice,
		selling_online_answer: event.payload.userProfile.sellingOnlineAnswer,
		selling_platforms: event.payload.userProfile.sellingPlatforms
			? event.payload.userProfile.sellingPlatforms.join()
			: null,
	} );
};

const recordTracksSkipBusinessLocationCompleted = () => {
	recordEvent( 'coreprofiler_step_complete', {
		step: 'skip_business_location',
		wc_version: getSetting( 'wcVersion' ),
	} );
};

// Temporarily expand the step viewed track for BusinessInfo so that we can include the experiment assignment
// Remove this and change the action back to recordTracksStepViewed when the experiment is over
const recordTracksStepViewedBusinessInfo = (
	context: CoreProfilerStateMachineContext,
	_event: unknown,
	{ action }: { action: unknown }
) => {
	const { step } = action as { step: string };
	recordEvent( 'coreprofiler_step_view', {
		step,
		email_marketing_experiment_assignment:
			context.emailMarketingExperimentAssignment,
		wc_version: getSetting( 'wcVersion' ),
	} );
};

const recordTracksIsEmailChanged = (
	context: CoreProfilerStateMachineContext,
	event: BusinessInfoEvent
) => {
	if ( context.emailMarketingExperimentAssignment === 'treatment' ) {
		let emailSource, isEmailChanged;
		if ( context.onboardingProfile.store_email ) {
			emailSource = 'onboarding_profile_store_email'; // from previous entry
			isEmailChanged =
				event.payload.storeEmailAddress !==
				context.onboardingProfile.store_email;
		} else if ( context.currentUserEmail ) {
			emailSource = 'current_user_email'; // from currentUser
			isEmailChanged =
				event.payload.storeEmailAddress !== context.currentUserEmail;
		} else {
			emailSource = 'was_empty';
			isEmailChanged = event.payload.storeEmailAddress?.length > 0;
		}

		recordEvent( 'coreprofiler_email_marketing', {
			opt_in: event.payload.isOptInMarketing,
			email_field_prefilled_source: emailSource,
			email_field_modified: isEmailChanged,
		} );
	}
};

const recordTracksBusinessInfoCompleted = (
	context: CoreProfilerStateMachineContext,
	event: Extract< BusinessInfoEvent, { type: 'BUSINESS_INFO_COMPLETED' } >
) => {
	recordEvent( 'coreprofiler_step_complete', {
		step: 'business_info',
		email_marketing_experiment_assignment:
			context.emailMarketingExperimentAssignment,
		wc_version: getSetting( 'wcVersion' ),
	} );

	recordEvent( 'coreprofiler_business_info', {
		business_name_filled:
			POSSIBLY_DEFAULT_STORE_NAMES.findIndex(
				( name ) => name === event.payload.storeName
			) === -1,
		industry: event.payload.industry,
		store_location_previously_set:
			context.onboardingProfile.is_store_country_set || false,
		geolocation_success: context.geolocatedLocation !== undefined,
		geolocation_overruled: event.payload.geolocationOverruled,
	} );
};

const recordTracksPluginsInstallationRequest = (
	_context: CoreProfilerStateMachineContext,
	event: Extract<
		PluginsInstallationRequestedEvent,
		{ type: 'PLUGINS_INSTALLATION_REQUESTED' }
	>
) => {
	recordEvent( 'coreprofiler_store_extensions_continue', {
		shown: event.payload.pluginsShown || [],
		selected: event.payload.pluginsSelected || [],
		unselected: event.payload.pluginsUnselected || [],
	} );
};

const recordTracksPluginsLearnMoreLinkClicked = (
	_context: unknown,
	_event: PluginsLearnMoreLinkClicked,
	{ action }: { action: unknown }
) => {
	const { step } = action as { step: string };
	recordEvent( `coreprofiler_${ step }_learn_more_link_clicked`, {
		plugin: _event.payload.plugin,
		link: _event.payload.learnMoreLink,
	} );
};

const recordFailedPluginInstallations = (
	_context: unknown,
	_event: PluginsInstallationCompletedWithErrorsEvent
) => {
	recordEvent( 'coreprofiler_store_extensions_installed_and_activated', {
		success: false,
		failed_extensions: _event.payload.errors.map(
			( error: PluginInstallError ) => getPluginTrackKey( error.plugin )
		),
	} );
};

const recordSuccessfulPluginInstallation = (
	_context: unknown,
	_event: PluginsInstallationCompletedEvent
) => {
	const installationCompletedResult =
		_event.payload.installationCompletedResult;

	const trackData: {
		success: boolean;
		installed_extensions: string[];
		total_time: string;
		[ key: string ]: number | boolean | string | string[];
	} = {
		success: true,
		installed_extensions: installationCompletedResult.installedPlugins.map(
			( installedPlugin: InstalledPlugin ) =>
				getPluginTrackKey( installedPlugin.plugin )
		),
		total_time: getTimeFrame( installationCompletedResult.totalTime ),
	};

	for ( const installedPlugin of installationCompletedResult.installedPlugins ) {
		trackData[
			'install_time_' + getPluginTrackKey( installedPlugin.plugin )
		] = getTimeFrame( installedPlugin.installTime );
	}

	recordEvent(
		'coreprofiler_store_extensions_installed_and_activated',
		trackData
	);
};

export default {
	recordTracksStepViewed,
	recordTracksStepSkipped,
	recordTracksIntroCompleted,
	recordTracksUserProfileCompleted,
	recordTracksSkipBusinessLocationCompleted,
	recordTracksBusinessInfoCompleted,
	recordTracksPluginsLearnMoreLinkClicked,
	recordFailedPluginInstallations,
	recordSuccessfulPluginInstallation,
	recordTracksPluginsInstallationRequest,
	recordTracksIsEmailChanged,
	recordTracksStepViewedBusinessInfo,
};
