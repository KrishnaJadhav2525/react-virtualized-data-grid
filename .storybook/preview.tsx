import type { Preview } from "@storybook/react";
import "../src/index.css";

const preview: Preview = {
    parameters: {
        controls: {
            matchers: {
                color: /(background|color)$/i,
                date: /Date$/i,
            },
        },
        a11y: {
            config: {
                rules: [
                    // some rules we want to be strict about
                    { id: 'color-contrast', enabled: true },
                    { id: 'keyboard', enabled: true },
                ],
            },
        },
    },
    globalTypes: {
        theme: {
            description: 'Color theme',
            defaultValue: 'light',
            toolbar: {
                title: 'Theme',
                items: [
                    { value: 'light', title: 'Light' },
                    { value: 'high-contrast', title: 'High Contrast' },
                ],
                dynamicTitle: true,
            },
        },
    },
    decorators: [
        (Story, context) => {
            const theme = context.globals['theme'] as string;
            return (
                <div className={theme === 'high-contrast' ? 'high-contrast' : ''}>
                    <Story />
                </div>
            );
        },
    ],
};

export default preview;
