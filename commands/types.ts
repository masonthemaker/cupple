import type {CuppleSettings} from '../utils/index.js';
import type {ServerInfo} from '../api/index.js';

export type CommandResult = {
	success: boolean;
	message: string;
	color?: string;
};

export type CommandContext = {
	settings: CuppleSettings;
	serverInfo?: ServerInfo;
	onSettingsUpdate: (settings: CuppleSettings) => void;
	onClearHistory: () => void;
	onExit: () => void;
};

export type CommandHandler = (
	context: CommandContext,
) => Promise<CommandResult> | CommandResult | null;

