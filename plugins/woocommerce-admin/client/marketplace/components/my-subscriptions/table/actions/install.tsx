/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { dispatch, useSelect } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { recordEvent } from '@woocommerce/tracks';

/**
 * Internal dependencies
 */
import { SubscriptionsContext } from '../../../../contexts/subscriptions-context';
import {
	addNotice,
	installProduct,
	removeNotice,
} from '../../../../utils/functions';
import { Subscription } from '../../types';
import { installingStore } from '../../../../contexts/install-store';
import { NoticeStatus } from '../../../../contexts/types';

interface InstallProps {
	subscription: Subscription;
}

export default function Install( props: InstallProps ) {
	const { loadSubscriptions } = useContext( SubscriptionsContext );

	const loading: boolean = useSelect(
		( select ) => {
			return select( installingStore ).isInstalling(
				props.subscription.product_key
			);
		},
		[ props.subscription.product_key ]
	);

	const startInstall = () => {
		dispatch( installingStore ).startInstalling(
			props.subscription.product_key
		);
	};
	const stopInstall = () => {
		dispatch( installingStore ).stopInstalling(
			props.subscription.product_key
		);
	};

	const install = () => {
		recordEvent( 'marketplace_product_install_button_clicked', {
			product_zip_slug: props.subscription.zip_slug,
			product_id: props.subscription.product_id,
			product_current_version: props.subscription.version,
		} );

		startInstall();
		removeNotice( props.subscription.product_key );
		installProduct( props.subscription )
			.then( () => {
				loadSubscriptions( false ).then( () => {
					addNotice(
						props.subscription.product_key,
						sprintf(
							// translators: %s is the product name.
							__( '%s successfully installed.', 'woocommerce' ),
							props.subscription.product_name
						),
						NoticeStatus.Success
					);
					stopInstall();
				} );

				recordEvent( 'marketplace_product_installed', {
					product_zip_slug: props.subscription.zip_slug,
					product_id: props.subscription.product_id,
					product_current_version: props.subscription.version,
				} );
			} )
			.catch( ( error ) => {
				loadSubscriptions( false ).then( () => {
					let errorMessage = sprintf(
						// translators: %s is the product name.
						__( '%s couldn’t be installed.', 'woocommerce' ),
						props.subscription.product_name
					);
					if ( error?.success === false && error?.data.message ) {
						errorMessage += ' ' + error.data.message;
					}
					addNotice(
						props.subscription.product_key,
						errorMessage,
						NoticeStatus.Error,
						{
							actions: [
								{
									label: __( 'Try again', 'woocommerce' ),
									onClick: install,
								},
							],
						}
					);
					stopInstall();
				} );

				recordEvent( 'marketplace_product_install_failed', {
					product_zip_slug: props.subscription.zip_slug,
					product_id: props.subscription.product_id,
					product_current_version: props.subscription.version,
				} );
			} );
	};

	return (
		<Button
			variant="link"
			isBusy={ loading }
			disabled={ loading }
			onClick={ install }
		>
			{ __( 'Install', 'woocommerce' ) }
		</Button>
	);
}
