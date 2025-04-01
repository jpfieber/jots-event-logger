import { Modal } from 'obsidian';

export default class DateInputModal extends Modal {
    private onSubmit: (data: { description: string; inputDate: string; eventType: string; icon: string; startTime: string; endTime: string; journalPrefix: string }) => void;
    private settings: any;

    constructor(app: any, onSubmit: (data: any) => void, settings: any) {
        super(app);
        this.onSubmit = onSubmit;
        this.settings = settings;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Enter Event Details' }).addClass('modal-header');

        this.createLabel(contentEl, 'Event type');
        const eventTypeEl = this.createSelect(contentEl, this.settings.eventTypes.map((option: any) => option.display));

        this.createLabel(contentEl, 'Describe the event');
        const descriptionEl = this.createInput(contentEl, 'text', 'Describe the event');

        const dateTimeContainer = contentEl.createEl('div');
        dateTimeContainer.addClass('modal-datetime-container');

        const dateContainer = this.createDateTimeContainer(dateTimeContainer, 'Event date', 'date', new Date().toISOString().split('T')[0]);
        const startTimeContainer = this.createDateTimeContainer(dateTimeContainer, 'Start time', 'time', '00:00');
        const endTimeContainer = this.createDateTimeContainer(dateTimeContainer, 'End time', 'time', '00:00');

        const submitButton = contentEl.createEl('button', { text: 'Submit' });
        submitButton.addClass('modal-button');
        submitButton.onclick = async () => {
            const description = descriptionEl.value;
            const inputDate = dateContainer.value;
            const eventType = eventTypeEl.value;
            const eventTypeObj = this.settings.eventTypes.find((option: any) => option.display === eventType);
            const icon = eventTypeObj ? eventTypeObj.icon : '';
            const startTime = startTimeContainer.value;
            const endTime = endTimeContainer.value;
            const journalPrefix = this.settings.journalPrefix;
            this.onSubmit({ description, inputDate, eventType, icon, startTime, endTime, journalPrefix });
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