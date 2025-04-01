import { Modal } from 'obsidian';

export default class JournalOnlyModal extends Modal {
    private onSubmit: (data: { description: string; inputDate: string; icon: string; startTime: string; journalPrefix: string }) => void;
    private settings: any;

    constructor(app: any, onSubmit: (data: { description: string; inputDate: string; icon: string; startTime: string; journalPrefix: string }) => void, settings: any) {
        super(app);
        this.onSubmit = onSubmit;
        this.settings = settings;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Enter Event Details' }).addClass('modal-header');

        this.createLabel(contentEl, 'Icon');
        const iconOptions = this.settings.iconOptions.split(',');
        const iconEl = this.createSelect(contentEl, iconOptions);

        this.createLabel(contentEl, 'Describe the event');
        const descriptionEl = this.createInput(contentEl, 'text', 'Describe the event');

        const dateTimeContainer = contentEl.createEl('div');
        dateTimeContainer.addClass('modal-datetime-container');

        const dateContainer = this.createDateTimeContainer(dateTimeContainer, 'Event date', 'date', new Date().toISOString().split('T')[0]);
        const startTimeContainer = this.createDateTimeContainer(dateTimeContainer, 'Start time', 'time', '00:00');

        const submitButton = contentEl.createEl('button', { text: 'Submit' });
        submitButton.addClass('modal-button');
        submitButton.onclick = async () => {
            const description = descriptionEl.value;
            const inputDate = dateContainer.value;
            const icon = iconEl.value;
            const startTime = startTimeContainer.value;
            const journalPrefix = this.settings.journalPrefix;
            this.onSubmit({ description, inputDate, icon, startTime, journalPrefix });
            this.close();
        };
    }

    private createLabel(container: HTMLElement, text: string) {
        container.createEl('label', { text }).addClass('modal-label');
    }

    private createInput(container: HTMLElement, type: string, placeholder: string) {
        const inputEl = container.createEl('input', { type, placeholder });
        inputEl.addClass('modal-input');
        return inputEl;
    }

    private createSelect(container: HTMLElement, options: string[], selectedOption = '') {
        const selectEl = container.createEl('select');
        selectEl.addClass('modal-input');
        options.forEach(option => {
            const optionEl = selectEl.createEl('option', { text: option });
            optionEl.value = option;
            if (option === selectedOption) {
                optionEl.selected = true;
            }
        });
        return selectEl;
    }

    private createDateTimeContainer(container: HTMLElement, labelText: string, inputType: string, defaultValue: string) {
        const dateTimeContainer = container.createEl('div');
        dateTimeContainer.addClass('modal-time-container');
        this.createLabel(dateTimeContainer, labelText);
        const inputEl = this.createInput(dateTimeContainer, inputType, '');
        inputEl.value = defaultValue;
        return inputEl;
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}