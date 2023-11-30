declare global {
	interface Window {
		pagenow: string;
		adminpage: string;
		wcSettings: {
			preloadOptions: Record< string, unknown >;
			adminUrl: string;
		};
		wcAdminFeatures: {
			'activity-panels': boolean;
			analytics: boolean;
			coupons: boolean;
			'customer-effort-score-tracks': boolean;
			homescreen: boolean;
			marketing: boolean;
			'minified-js': boolean;
			'mobile-app-banner': boolean;
			navigation: boolean;
			'new-product-management-experience': boolean;
			onboarding: boolean;
			'onboarding-tasks': boolean;
			'payment-gateway-suggestions': boolean;
			'product-variation-management': boolean;
			'product-virtual-downloadable': boolean;
			'product-external-affiliate': boolean;
			'product-grouped': boolean;
			'remote-inbox-notifications': boolean;
			'remote-free-extensions': boolean;
			settings: boolean;
			'shipping-label-banner': boolean;
			subscriptions: boolean;
			'store-alerts': boolean;
			'transient-notices': boolean;
			'wc-pay-promotion': boolean;
			'wc-pay-welcome-page': boolean;
			'woo-mobile-welcome': boolean;
			'shipping-smart-defaults': boolean;
			'shipping-setting-tour': boolean;
		};
		wp: {
			updates?: {
				ajax: ( action, data: {
					slug?: string;
					plugin?: string;
					theme?: string;
					success?: function;
					error?: function;
				} ) => JQuery.Promise;
			};
			autosave?: {
				server: {
					postChanged: () => boolean;
				};
			};
		};
		tinymce?: {
			get: ( name: string ) => {
				isHidden: () => boolean;
				isDirty: () => boolean;
			};
		};
		getUserSetting?: ( name: string ) => string | undefined;
		setUserSetting?: ( name: string, value: string ) => void;
		deleteUserSetting?: ( name: string ) => void;
	}
}

/*~ If your module exports nothing, you'll need this line. Otherwise, delete it */
export {};
