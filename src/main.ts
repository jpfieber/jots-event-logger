import { Plugin, TFile } from 'obsidian';
import DateInputModal from './modals/DateInputModal';
import JournalOnlyModal from './modals/JournalOnlyModal';
import EventLoggerSettingTab from './settings';
import { isJotsAssistantAvailable } from './utils/jotsIntegration';
import moment from 'moment';

export interface EventLoggerSettings {
    journalFolder: string;
    journalNameFormat: string;
    eventFolder: string;
    eventNameFormat: string;
    iconOptions: string;
    journalPrefix: string;
    svgUri: string;
    nestJournalEntries: boolean;
    eventTypes: { display: string; prefix: string; icon: string }[];
}

const DEFAULT_SETTINGS: EventLoggerSettings = {
    journalFolder: "Stacks/Journals",
    journalNameFormat: "YYYY/YYYY-MM/YYYY-MM-DD_ddd",
    eventFolder: "Stacks/Events",
    eventNameFormat: "YYYYMMDD - description",
    iconOptions: '💼,🚹,🚺,👫,🏈,🎈,💦,📚,📆',
    journalPrefix: 'e',
    svgUri: '',
    nestJournalEntries: false,
    eventTypes: []
};

export default class EventLoggerPlugin extends Plugin {
    settings!: EventLoggerSettings; // Use non-null assertion operator

    async onload() {
        console.log('Event Logger: Loading plugin');

        await this.loadSettings();

        this.addSettingTab(new EventLoggerSettingTab(this.app, this));

        // Command to create an event with a file
        this.addCommand({
            id: 'create-event-with-file',
            name: 'Create Event in Journal with File',
            callback: () => this.showByDate(true) // Calls showByDate with createEventFile = true
        });

        // Command to create an event in the journal only
        this.addCommand({
            id: 'open-date-input-modal',
            name: 'Create Event in Journal',
            callback: () => this.showJournalOnly() // Calls showJournalOnly
        });

        this.injectCSS();
    }

    onunload() {
        console.log('Event Logger: Unloading plugin');
        this.removeCSS();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
        this.injectCSS();
    }

    injectCSS() {
        const svgUri = this.settings.svgUri;
        const journalPrefix = this.settings.journalPrefix;
        const css = `
            input[data-task="${journalPrefix}"]:checked,
            li[data-task="${journalPrefix}"]>input:checked,
            li[data-task="${journalPrefix}"]>p>input:checked {
                --checkbox-marker-color: transparent;
                border: none;
                border-radius: 0;
                background-image: none;
                background-color: currentColor;
                pointer-events: none;
                -webkit-mask-size: var(--checkbox-icon);
                -webkit-mask-position: 50% 50%;
                color: #13BE55;
                margin-left: -48px;
                -webkit-mask-image: url("${svgUri}");
            }

            body [data-task="${journalPrefix}"]>.dataview.inline-field>.dataview.inline-field-key::after {
                content: "=";
                color: #13BE55;
            }
        `;

        this.removeCSS();

        const style = document.createElement('style');
        style.id = 'event-logger-dynamic-css';
        style.textContent = css;
        document.head.appendChild(style);
    }

    removeCSS() {
        const style = document.getElementById('event-logger-dynamic-css');
        if (style) {
            style.remove();
        }
    }

    async showByDate(createEventFile: boolean) {
        await this.loadSettings();
        new DateInputModal(this.app, async ({ description, inputDate, eventType, icon, startTime, endTime, journalPrefix }) => {
            if (description && inputDate && eventType && icon && startTime && endTime) {
                const eventTypeObj = this.settings.eventTypes.find(option => option.display === eventType);
                const prefix = eventTypeObj ? eventTypeObj.prefix : '';
                const formattedString = `- [${journalPrefix}] (time:: ${startTime}) (type:: ${icon}) (event:: [[${moment(inputDate).local().format('YYYYMMDD')} - ${prefix ? `${prefix} -- ` : ''}${description}|${description}]])`;
                await this.addToJournal(inputDate, formattedString);

                if (createEventFile) {
                    console.log('Event Logger: Creating event file...');
                    await this.createEventFile(inputDate, eventType, description, startTime, endTime, prefix);
                }
            }
        }, this.settings).open();
    }

    async showJournalOnly() {
        await this.loadSettings();
        new JournalOnlyModal(this.app, async ({ description, inputDate, icon, startTime, journalPrefix }) => {
            if (description && inputDate && icon && startTime) {
                const formattedString = `- [${journalPrefix}] (time:: ${startTime}) (type:: ${icon}) (event:: ${description})`;
                await this.addToJournal(inputDate, formattedString);
            }
        }, this.settings).open();
    }

    async addToJournal(inputDate: string, formattedString: string) {
        let journalFolder = this.settings.journalFolder;
        let formattedDate;

        // Parse the input date to ensure we have a valid moment object
        const date = moment(inputDate);

        // Use JOTS Assistant settings if available
        if (isJotsAssistantAvailable()) {
            const jotsInfo = window.JotsAssistant!.api.getJournalPathInfo();            journalFolder = jotsInfo.rootFolder;
            
            // Build the path using the exact format strings from JOTS Assistant
            const folderPart = date.format(jotsInfo.folderPattern);
            const fileName = date.format('YYYY-MM-DD_ddd'); // Hard-code this format to ensure correct day abbreviation
            formattedDate = `${folderPart}/${fileName}`;
        } else {
            formattedDate = date.format(this.settings.journalNameFormat);
        }
        const journalPath = `${journalFolder}/${formattedDate}.md`;


        // Ensure the folder structure exists
        const folderPath = journalPath.substring(0, journalPath.lastIndexOf('/'));
        await this.createFolderRecursively(folderPath);

        // Try to get or create the journal file
        let journalFile = await this.app.vault.getAbstractFileByPath(journalPath);
        if (!journalFile) {

            await this.app.vault.create(journalPath, '');
            journalFile = await this.app.vault.getAbstractFileByPath(journalPath);
        }

        if (journalFile instanceof TFile) {
            let content = await this.app.vault.read(journalFile);
            content = content.replace(/\n+$/, '');
            const entryString = this.settings.nestJournalEntries ? `> ${formattedString}` : formattedString;
            await this.app.vault.modify(journalFile, content + '\n' + entryString);

            // Call JOTS Assistant to add tracking and refresh headers/footers
            try {
                if (isJotsAssistantAvailable()) {
                    const jotsInfo = window.JotsAssistant!.api.getJournalPathInfo();
                    // Use the JOTS Assistant's file pattern to format the date
                    const datePart = moment(inputDate).format(jotsInfo.filePattern);

                    await window.JotsAssistant!.api.addJotsToJournal(datePart);
                    // Refresh headers and footers after adding JOTS (if the function exists)
                    if (typeof window.JotsAssistant!.api.refreshHeadersAndFooters === 'function') {
                        await window.JotsAssistant!.api.refreshHeadersAndFooters();
                    }
                }
            } catch (error) {
                console.warn('JOTS Event Logger: Failed to add JOTS to journal:', error);
            }
        } else {
            console.log('Event Logger: Journal file not found.');
        }
    }

    async createEventFile(inputDate: string, eventType: string, description: string, startTime: string, endTime: string, prefix: string) {
        console.log('Event Logger: Starting to create event file...');
        const year = moment(inputDate).format('YYYY'); // Extract year
        const yearMonth = moment(inputDate).format('YYYY-MM'); // Extract year and month
        const eventFileName = `${moment(inputDate).format('YYYYMMDD')} - ${prefix ? `${prefix} -- ` : ''}${description}.md`;
        const eventFilePath = `${this.settings.eventFolder}/${year}/${yearMonth}/${eventFileName}`; // Correct folder structure
        const folderPath = eventFilePath.substring(0, eventFilePath.lastIndexOf('/')); // Extract folder path
        const currentDatedTime = this.getCurrentDateTime();
        const eventFileContent = `---\n
type: ${eventType.toLowerCase().replace(/\s+/g, '').replace(/'/g, '')}\n
title: ${description}\n
startTime: ${startTime}\n
endTime: ${endTime}\n
date: ${inputDate}\n
fileClass: Events\n
created: ${currentDatedTime}\n
filename: ${moment(inputDate).format('YYYYMMDD')} - ${prefix ? `${prefix} -- ` : ''}${description}\n
attendees: \n
place: \n
documents: \n
---\n\n
# ${moment(inputDate).format('YYYYMMDD')} - ${description}`;

        // Ensure the folder structure exists
        await this.createFolderRecursively(folderPath);

        // Create the file
        try {
            await this.app.vault.create(eventFilePath, eventFileContent);
            console.log(`Event Logger: Event file successfully created at: ${eventFilePath}`);
        } catch (error) {
            console.error(`Event Logger: Failed to create event file. Error: ${error instanceof Error ? error.message : error}`);
        }
    }

    async createFolderRecursively(folderPath: string) {
        const parts = folderPath.split('/');
        let currentPath = '';
        for (const part of parts) {
            currentPath = currentPath ? `${currentPath}/${part}` : part;
            const folder = this.app.vault.getAbstractFileByPath(currentPath);
            if (!folder) {
                console.log(`Event Logger: Creating folder at ${currentPath}`);
                await this.app.vault.createFolder(currentPath);
            }
        }
    }

    getCurrentDateTime(): string {
        const now = new Date();
        const offset = -now.getTimezoneOffset();
        const sign = offset >= 0 ? '+' : '-';
        const pad = (num: number) => String(num).padStart(2, '0');
        const hours = pad(Math.floor(Math.abs(offset) / 60));
        const minutes = pad(Math.abs(offset) % 60);
        const isoString = now.toISOString().replace(/\.\d{3}Z$/, '');
        return `${isoString}${sign}${hours}:${minutes}`;
    }
}