import { Plugin, TFile } from 'obsidian';
import DateInputModal from './modals/DateInputModal';
import JournalOnlyModal from './modals/JournalOnlyModal';
import EventLoggerSettingTab from './settings';
import moment from 'moment';

export interface EventLoggerSettings {
    journalFolder: string;
    journalNameFormat: string;
    eventFolder: string;
    eventNameFormat: string;
    iconOptions: string;
    journalPrefix: string;
    svgUri: string;
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
    eventTypes: []
};

export default class EventLoggerPlugin extends Plugin {
    settings!: EventLoggerSettings; // Use non-null assertion operator

    async onload() {
        console.log('Event Logger: Loading plugin');

        await this.loadSettings();

        this.addSettingTab(new EventLoggerSettingTab(this.app, this));

        this.addCommand({
            id: 'create-event-with-file',
            name: 'Create Event in Journal with File',
            callback: () => this.showByDate(true)
        });

        this.addCommand({
            id: 'open-date-input-modal',
            name: 'Open Date Input Modal',
            callback: () => {
                new DateInputModal(this.app, (data) => {
                    console.log(data);
                }, this.settings).open();
            },
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
                const formattedString = `- [${journalPrefix}] (time:: ${startTime}) (type:: ${icon}) (event:: [[${moment(inputDate).format('YYYYMMDD')} - ${prefix} -- ${description}|${description}]])`;
                await this.addToJournal(inputDate, formattedString);

                if (createEventFile) {
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
        const formattedDate = moment(inputDate).format(this.settings.journalNameFormat);
        const journalPath = `${this.settings.journalFolder}/${formattedDate}.md`;
        const journalFile = await this.app.vault.getAbstractFileByPath(journalPath);
        if (journalFile instanceof TFile) {
            let content = await this.app.vault.read(journalFile);
            content = content.replace(/\n+$/, '');
            await this.app.vault.modify(journalFile, content + '\n' + formattedString);
        } else {
            console.log('Event Logger: Journal file not found.');
        }
    }

    async createEventFile(inputDate: string, eventType: string, description: string, startTime: string, endTime: string, prefix: string) {
        const formattedEventDate = moment(inputDate).format(this.settings.eventNameFormat);
        const eventFileName = `${formattedEventDate} - ${prefix} -- ${description}.md`;
        const eventFilePath = `${this.settings.eventFolder}/${eventFileName}`;
        const currentDatedTime = this.getCurrentDateTime();
        const eventFileContent = `---\n
type: ${eventType.toLowerCase().replace(/\s+/g, '').replace(/'/g, '')}\n
title: ${description}\n
startTime: ${startTime}\n
endTime: ${endTime}\n
date: ${inputDate}\n
fileClass: Events\n
created: ${currentDatedTime}\n
filename: ${moment(inputDate).format('YYYYMMDD')} - ${prefix} -- ${description}\n
attendees: \n
place: \n
documents: \n
---\n\n
# ${moment(inputDate).format('YYYYMMDD')} - ${description}`;

        await this.app.vault.create(eventFilePath, eventFileContent);
        console.log(`Event Logger: Event file created at: ${eventFilePath}`);
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