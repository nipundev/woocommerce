/* eslint-disable @typescript-eslint/ban-ts-comment */

/**
 * External dependencies
 */
import {
	Button,
	CheckboxControl,
	TextareaControl,
} from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { recordEvent } from '@woocommerce/tracks';

/**
 * Internal dependencies
 */

interface CloseSurveyFunction {
	(): void;
}

interface StarRatingChangeFunction {
	( value: number ): void;
}

const StarRating = ( {
	value,
	onChange,
}: {
	value: number;
	onChange: StarRatingChangeFunction;
} ): JSX.Element => {
	return (
		<div className="woocommerce-survey-star-rating">
			{ [ ...Array( 5 ) ].map( ( star, index ) => {
				index += 1;
				return (
					<button
						type="button"
						key={ index }
						className={
							index <= value
								? 'woocommerce-survey-star-rating__button-on'
								: 'woocommerce-survey-star-rating__button-off'
						}
						onClick={ () => {
							onChange( index );
						} }
					>
						<span className="woocommerce-survey-star-rating__star">
							&#9733;
						</span>
					</button>
				);
			} ) }
		</div>
	);
};

export const SurveyForm = ( {
	onSend,
	closeFunction,
}: {
	onSend: () => void;
	closeFunction: CloseSurveyFunction;
} ): JSX.Element => {
	const [ isStreamlineChecked, setStreamlineChecked ] = useState( false );
	const [ isDislikeThemesChecked, setDislikeChecked ] = useState( false );
	const [ isThemeNoMatchChecked, setThemeNoMatchChecked ] = useState( false );
	const [ isOtherChecked, setOtherChecked ] = useState( false );
	const [ feedbackText, setFeedbackText ] = useState( '' );
	const [ spillBeansText, setSpillBeansText ] = useState( '' );
	const { createSuccessNotice } = useDispatch( 'core/notices' );
	const [ rating, setRating ] = useState( 0 );

	const sendData = () => {
		recordEvent( 'customize_your_store_transitional_survey_complete', {
			rating,
			choose_streamline: isStreamlineChecked,
			choose_dislike_themes: isDislikeThemesChecked,
			choose_themes_not_match: isThemeNoMatchChecked,
			choose_other: isOtherChecked,
			feedback: feedbackText,
			spill_beans: spillBeansText,
		} );

		onSend();
		createSuccessNotice(
			__(
				"Thanks for the feedback. We'll put it to good use!",
				'woocommerce'
			),
			{
				type: 'snackbar',
			}
		);
	};

	return (
		<>
			<div className="woocommerce-ai-survey-form">
				<p className="woocommerce-ai-survey-form__description">
					{ __(
						'Our goal is to make sure you have all the right tools to start customizing your store. We’d love to know if we hit our mark and how we can improve.',
						'woocommerce'
					) }
				</p>

				<h4>
					{ __(
						'On a scale of 1 = difficult to 5 = very easy, how would you rate the overall experience? *',
						'woocommerce'
					) }
				</h4>
				<StarRating value={ rating } onChange={ setRating } />

				<hr />

				<h4>
					{ __(
						'What motivated you to choose the “Design with AI” option?',
						'woocommerce'
					) }
				</h4>
				<CheckboxControl
					label={ __(
						'I wanted to see how AI could help me streamline the process.',
						'woocommerce'
					) }
					checked={ isStreamlineChecked }
					onChange={ setStreamlineChecked }
				/>
				<CheckboxControl
					label={ __(
						'I didn’t like any of the available themes.',
						'woocommerce'
					) }
					checked={ isDislikeThemesChecked }
					onChange={ setDislikeChecked }
				/>
				<CheckboxControl
					label={ __(
						'I didn’t find a theme that matched my needs.',
						'woocommerce'
					) }
					checked={ isThemeNoMatchChecked }
					onChange={ setThemeNoMatchChecked }
				/>
				<CheckboxControl
					label={ __( 'Other.', 'woocommerce' ) }
					checked={ isOtherChecked }
					onChange={ setOtherChecked }
				/>

				<hr />

				<h4>
					{ __(
						'Did you find anything confusing, irrelevant, or not useful?',
						'woocommerce'
					) }
				</h4>
				<TextareaControl
					value={ feedbackText }
					onChange={ setFeedbackText }
				/>

				<h4>
					{ __(
						'Feel free to spill the beans here. All suggestions, feedback, or comments about the AI-generated store experience are welcome.',
						'woocommerce'
					) }
				</h4>
				<TextareaControl
					value={ spillBeansText }
					onChange={ setSpillBeansText }
				/>

				<div className="buttons">
					<Button
						className="is-spinner"
						variant="tertiary"
						onClick={ closeFunction }
					>
						{ __( 'Cancel', 'woocommerce' ) }
					</Button>

					<Button
						variant="primary"
						onClick={ sendData }
						disabled={ rating === 0 }
					>
						{ __( 'Send', 'woocommerce' ) }
					</Button>
				</div>
			</div>
		</>
	);
};
