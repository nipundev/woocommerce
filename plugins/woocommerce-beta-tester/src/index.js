/**
 * External dependencies
 */
import { render } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { App } from './app';
import './index.scss';
import './example-fills/experimental-woocommerce-wcpay-feature';
import { registerProductEditorDevTools } from './product-editor-dev-tools';

const appRoot = document.getElementById(
	'woocommerce-admin-test-helper-app-root'
);

if ( appRoot ) {
	render( <App />, appRoot );
}

registerProductEditorDevTools();
