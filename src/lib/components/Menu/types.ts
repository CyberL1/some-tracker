export type MenuItem = {
	label: string;
	type?: 'normal' | 'expandable' | 'divider';
	icon?: string;
	action?: string;
	items?: MenuItem[];
	shortcut?: string;
	disabled?: boolean | (() => boolean);
};
