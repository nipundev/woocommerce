// Reference: https://github.com/WordPress/gutenberg/blob/v16.4.0/packages/edit-site/src/components/save-hub/index.js
/* eslint-disable @woocommerce/dependency-group */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * External dependencies
 */
import {
	useCallback,
	useContext,
	useEffect,
	useState,
} from '@wordpress/element';
import { useQuery } from '@woocommerce/navigation';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	// @ts-ignore No types for this exist yet.
	__experimentalHStack as HStack,
	// @ts-ignore No types for this exist yet.
	__experimentalUseNavigator as useNavigator,
	Button,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
// @ts-ignore No types for this exist yet.
import { store as coreStore } from '@wordpress/core-data';
// @ts-ignore No types for this exist yet.
import { store as blockEditorStore } from '@wordpress/block-editor';
// @ts-ignore No types for this exist yet.
import { store as noticesStore } from '@wordpress/notices';
// @ts-ignore No types for this exist yet.
import { useEntitiesSavedStatesIsDirty as useIsDirty } from '@wordpress/editor';
import { recordEvent } from '@woocommerce/tracks';
// @ts-ignore No types for this exist yet.
import { useIsSiteEditorLoading } from '@wordpress/edit-site/build-module/components/layout/hooks';

/**
 * Internal dependencies
 */
import { CustomizeStoreContext } from '../';
import { HighlightedBlockContext } from '../context/highlighted-block-context';

const PUBLISH_ON_SAVE_ENTITIES = [
	{
		kind: 'postType',
		name: 'wp_navigation',
	},
];
let shouldTriggerSave = true;

export const SaveHub = () => {
	const urlParams = useQuery();
	const { sendEvent } = useContext( CustomizeStoreContext );
	const [ isResolving, setIsResolving ] = useState< boolean >( false );
	const navigator = useNavigator();
	const { resetHighlightedBlockIndex } = useContext(
		HighlightedBlockContext
	);
	const isEditorLoading = useIsSiteEditorLoading();
	// @ts-ignore No types for this exist yet.
	const { __unstableMarkLastChangeAsPersistent } =
		useDispatch( blockEditorStore );

	const { createErrorNotice } = useDispatch( noticesStore );

	const {
		dirtyEntityRecords,
		isDirty,
	}: {
		dirtyEntityRecords: {
			key?: string | number;
			kind: string;
			name: string;
			property?: string;
			title: string;
		}[];
		isDirty: boolean;
	} = useIsDirty();

	const { isSaving } = useSelect(
		( select ) => {
			return {
				isSaving: dirtyEntityRecords.some( ( record ) =>
					// @ts-ignore No types for this exist yet.
					select( coreStore ).isSavingEntityRecord(
						record.kind,
						record.name,
						record.key
					)
				),
			};
		},
		[ dirtyEntityRecords ]
	);

	const {
		// @ts-ignore No types for this exist yet.
		editEntityRecord,
		// @ts-ignore No types for this exist yet.
		saveEditedEntityRecord,
		// @ts-ignore No types for this exist yet.
		__experimentalSaveSpecifiedEntityEdits: saveSpecifiedEntityEdits,
	} = useDispatch( coreStore );

	const save = useCallback( async () => {
		for ( const { kind, name, key, property } of dirtyEntityRecords ) {
			if ( kind === 'root' && name === 'site' ) {
				await saveSpecifiedEntityEdits( 'root', 'site', undefined, [
					property,
				] );
			} else {
				if (
					PUBLISH_ON_SAVE_ENTITIES.some(
						( typeToPublish ) =>
							typeToPublish.kind === kind &&
							typeToPublish.name === name
					)
				) {
					editEntityRecord( kind, name, key, {
						status: 'publish',
					} );
				}

				await saveEditedEntityRecord( kind, name, key );
				__unstableMarkLastChangeAsPersistent();
			}
		}
	}, [
		dirtyEntityRecords,
		editEntityRecord,
		saveEditedEntityRecord,
		saveSpecifiedEntityEdits,
		__unstableMarkLastChangeAsPersistent,
	] );

	const isMainScreen = urlParams.path === '/customize-store/assembler-hub';

	// Trigger a save when the editor is loaded and there are unsaved changes in main screen. This is needed to ensure FE is displayed correctly because some patterns have dynamic attributes that only generate in Editor.
	useEffect( () => {
		if ( isEditorLoading ) {
			return;
		}

		if ( ! isMainScreen ) {
			shouldTriggerSave = false;
			return;
		}

		if ( shouldTriggerSave && isDirty ) {
			save();
			shouldTriggerSave = false;
		}
	}, [ isEditorLoading, isDirty, isMainScreen, save ] );

	const onClickSaveButton = async () => {
		const source = `${ urlParams.path.replace(
			'/customize-store/assembler-hub/',
			''
		) }`;
		recordEvent( 'customize_your_store_assembler_hub_save_click', {
			source,
		} );

		try {
			await save();
			resetHighlightedBlockIndex();
			navigator.goToParent();
		} catch ( error ) {
			createErrorNotice(
				`${ __( 'Saving failed.', 'woocommerce' ) } ${ error }`
			);
		}
	};

	const onDone = async () => {
		recordEvent( 'customize_your_store_assembler_hub_done_click' );
		setIsResolving( true );

		try {
			await save();
			sendEvent( 'FINISH_CUSTOMIZATION' );
		} catch ( error ) {
			createErrorNotice(
				`${ __( 'Saving failed.', 'woocommerce' ) } ${ error }`
			);
			setIsResolving( false );
		}
	};

	const renderButton = () => {
		if ( isMainScreen ) {
			return (
				<Button
					variant="primary"
					onClick={ onDone }
					className="edit-site-save-hub__button"
					disabled={ isResolving || isEditorLoading }
					aria-disabled={ isResolving }
					// @ts-ignore No types for this exist yet.
					__next40pxDefaultSize
				>
					{ isResolving ? <Spinner /> : __( 'Done', 'woocommerce' ) }
				</Button>
			);
		}

		// if we have only one unsaved change and it matches current context, we can show a more specific label
		const label = isSaving
			? __( 'Saving', 'woocommerce' )
			: __( 'Save', 'woocommerce' );

		const isDisabled = ! isDirty || isSaving;

		return (
			<Button
				variant="primary"
				onClick={ onClickSaveButton }
				disabled={ isDisabled }
				aria-disabled={ isDisabled }
				className="edit-site-save-hub__button"
				// @ts-ignore No types for this exist yet.
				__next40pxDefaultSize
			>
				{ isSaving ? <Spinner /> : label }
			</Button>
		);
	};

	return (
		<HStack className="edit-site-save-hub" alignment="right" spacing={ 4 }>
			{ renderButton() }
		</HStack>
	);
};
