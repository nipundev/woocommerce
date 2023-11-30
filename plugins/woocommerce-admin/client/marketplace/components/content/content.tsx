/**
 * External dependencies
 */
import { useContext, useEffect, useState } from '@wordpress/element';
import { useQuery } from '@woocommerce/navigation';

/**
 * Internal dependencies
 */
import './content.scss';
import { Product, ProductType, SearchResultType } from '../product-list/types';
import { getAdminSetting } from '../../../utils/admin-settings';
import Discover from '../discover/discover';
import Products from '../products/products';
import SearchResults from '../search-results/search-results';
import MySubscriptions from '../my-subscriptions/my-subscriptions';
import { MarketplaceContext } from '../../contexts/marketplace-context';
import { fetchSearchResults } from '../../utils/functions';
import { SubscriptionsContextProvider } from '../../contexts/subscriptions-context';
import {
	recordMarketplaceView,
	recordLegacyTabView,
} from '../../utils/tracking';

export default function Content(): JSX.Element {
	const marketplaceContextValue = useContext( MarketplaceContext );
	const [ products, setProducts ] = useState< Product[] >( [] );
	const { setIsLoading, selectedTab } = marketplaceContextValue;
	const query = useQuery();

	// Get the content for this screen
	useEffect( () => {
		const abortController = new AbortController();
		// we are recording both the new and legacy events here for now
		// they're separate methods to make it easier to remove the legacy one later
		const marketplaceViewProps = {
			view: query?.tab,
			search_term: query?.term,
			product_type: query?.section,
			category: query?.category,
		};

		recordMarketplaceView( marketplaceViewProps );
		recordLegacyTabView( marketplaceViewProps );

		if ( query.tab && [ '', 'discover' ].includes( query.tab ) ) {
			return;
		}

		setIsLoading( true );
		setProducts( [] );

		const params = new URLSearchParams();

		if ( query.term ) {
			params.append( 'term', query.term );
		}

		if ( query.category ) {
			params.append(
				'category',
				query.category === '_all' ? '' : query.category
			);
		} else if ( query?.tab === 'themes' ) {
			params.append( 'category', 'themes' );
		} else if ( query?.tab === 'search' ) {
			params.append( 'category', 'extensions-themes' );
		}

		const wccomSettings = getAdminSetting( 'wccomHelper', false );
		if ( wccomSettings.storeCountry ) {
			params.append( 'country', wccomSettings.storeCountry );
		}

		fetchSearchResults( params, abortController.signal )
			.then( ( productList ) => {
				setProducts( productList );
			} )
			.catch( () => {
				setProducts( [] );
			} )
			.finally( () => {
				setIsLoading( false );
			} );
		return () => {
			abortController.abort();
		};
	}, [
		query.term,
		query.category,
		query?.tab,
		setIsLoading,
		query?.section,
	] );

	const renderContent = (): JSX.Element => {
		switch ( selectedTab ) {
			case 'extensions':
				return (
					<Products
						products={ products }
						categorySelector={ true }
						type={ ProductType.extension }
					/>
				);
			case 'themes':
				return (
					<Products
						products={ products }
						categorySelector={ true }
						type={ ProductType.theme }
					/>
				);
			case 'search':
				return (
					<SearchResults
						products={ products }
						type={ SearchResultType.all }
					/>
				);
			case 'discover':
				return <Discover />;
			case 'my-subscriptions':
				return (
					<SubscriptionsContextProvider>
						<MySubscriptions />
					</SubscriptionsContextProvider>
				);
			default:
				return <></>;
		}
	};

	return (
		<div className="woocommerce-marketplace__content">
			{ renderContent() }
		</div>
	);
}
