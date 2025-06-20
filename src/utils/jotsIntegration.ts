import type { JotsAssistant } from '../types/jotsAssistant';

/**
 * Check if JOTS Assistant is available
 * @returns True if JOTS Assistant is installed and active
 */
export function isJotsAssistantAvailable(): boolean {
    return window.JotsAssistant?.api !== undefined;
}

/**
 * Add JOTS to a journal using JOTS Assistant
 * @param journalName The name of the journal to add JOTS to
 * @returns Promise that resolves when the operation is complete
 */
export async function addJotsToJournal(journalName: string): Promise<void> {    if (!isJotsAssistantAvailable()) {
        console.error('JOTS Event Logger: JOTS Assistant is not available');
        throw new Error('JOTS Assistant is not available');
    }

    try {
        await window.JotsAssistant!.api.addJotsToJournal(journalName);
    } catch (error) {
        console.error('JOTS Event Logger: Failed to add JOTS to journal:', error);
        throw error;
    }
}

/**
 * Get journal path information
 * @param settings The plugin settings
 * @returns Object containing root folder, folder pattern, and file pattern
 */
export function getJournalPathInfo(settings: any) {
    if (isJotsAssistantAvailable()) {
        const jotsInfo = window.JotsAssistant?.api.getJournalPathInfo();
        if (!jotsInfo) {
            throw new Error('Failed to get journal path info from JOTS Assistant');
        }
        return jotsInfo;
    }

    return {
        rootFolder: settings.journalFolder,
        folderPattern: settings.journalNameFormat,
        filePattern: settings.journalNameFormat
    };
}
