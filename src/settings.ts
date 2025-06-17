import { App, PluginSettingTab, Setting } from 'obsidian';
import EventLoggerPlugin from './main';

export default class EventLoggerSettingTab extends PluginSettingTab {
    plugin: EventLoggerPlugin;

    constructor(app: App, plugin: EventLoggerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'Event Logger Settings' });

        // Journal Folder Setting
        new Setting(containerEl)
            .setName('Journal Folder')
            .setDesc('Set the location of the main Journal folder.')
            .addText(text => {
                text
                    .setPlaceholder('Stacks/Journals')
                    .setValue(this.plugin.settings.journalFolder || 'Stacks/Journals')
                    .onChange(async (value) => {
                        this.plugin.settings.journalFolder = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Journal Name Format Setting
        new Setting(containerEl)
            .setName('Journal Name Format')
            .setDesc('Set the format of the Journal name, including the subfolder path.')
            .addText(text => {
                text
                    .setPlaceholder('YYYY/YYYY-MM/YYYY-MM-DD_ddd')
                    .setValue(this.plugin.settings.journalNameFormat || 'YYYY/YYYY-MM/YYYY-MM-DD_ddd')
                    .onChange(async (value) => {
                        this.plugin.settings.journalNameFormat = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Event Folder Setting
        new Setting(containerEl)
            .setName('Event Folder')
            .setDesc('Set the location of the main Event folder.')
            .addText(text => {
                text
                    .setPlaceholder('Stacks/Events')
                    .setValue(this.plugin.settings.eventFolder || 'Stacks/Events')
                    .onChange(async (value) => {
                        this.plugin.settings.eventFolder = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Nest Journal Entries Setting
        new Setting(containerEl)
            .setName("Nest Journal Entries in Callout")
            .setDesc("When enabled, journal entries will be nested as callouts with a '> ' prefix")
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.nestJournalEntries || false)
                    .onChange(async (value) => {
                        this.plugin.settings.nestJournalEntries = value;
                        await this.plugin.saveSettings();
                    })
            );

        // Event Name Format Setting
        new Setting(containerEl)
            .setName('Event Name Format')
            .setDesc('Set the format of the Event name, including the subfolder path.')
            .addText(text => {
                text
                    .setPlaceholder('YYYYMMDD - description')
                    .setValue(this.plugin.settings.eventNameFormat || 'YYYYMMDD - description')
                    .onChange(async (value) => {
                        this.plugin.settings.eventNameFormat = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Icon Options Setting
        new Setting(containerEl)
            .setName('Icon Options')
            .setDesc('Set the available icons for Journal events.')
            .addText(text => {
                text
                    .setPlaceholder('💼,🚹,🚺,👫,🏈,🎈,💦,📚,📆')
                    .setValue(this.plugin.settings.iconOptions || '💼,🚹,🚺,👫,🏈,🎈,💦,📚,📆')
                    .onChange(async (value) => {
                        this.plugin.settings.iconOptions = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Journal Prefix Setting
        new Setting(containerEl)
            .setName('String Prefix Letter')
            .setDesc('Set the letter to prefix the string.')
            .addText(text => {
                text
                    .setPlaceholder('e')
                    .setValue(this.plugin.settings.journalPrefix || 'e')
                    .onChange(async (value) => {
                        this.plugin.settings.journalPrefix = value;
                        await this.plugin.saveSettings();
                    });
            });

        // SVG URI Setting
        new Setting(containerEl)
            .setName('Decorated Task Symbol')
            .setDesc('Set the Data URI for the SVG icon to use before the inserted event string.')
            .addText(text => {
                text
                    .setPlaceholder('Enter SVG URI')
                    .setValue(this.plugin.settings.svgUri || '')
                    .onChange(async (value) => {
                        this.plugin.settings.svgUri = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Event Types Section
        containerEl.createEl('h3', { text: 'Event Types' });

        const eventTypeContainer = containerEl.createEl('div', { cls: 'event-type-container' });

        this.plugin.settings.eventTypes.forEach((eventType, index) => {
            const settingRow = eventTypeContainer.createEl('div', { cls: 'event-type-row' });

            // Display Name Setting
            new Setting(settingRow)
                .setName('Display Name')
                .addText(text => {
                    text
                        .setPlaceholder('Enter display name')
                        .setValue(eventType.display || '')
                        .onChange(async (value) => {
                            this.plugin.settings.eventTypes[index].display = value;
                            await this.plugin.saveSettings();
                        });
                });

            // Prefix Setting
            new Setting(settingRow)
                .setName('Prefix')
                .addText(text => {
                    text
                        .setPlaceholder('Enter prefix')
                        .setValue(eventType.prefix || '')
                        .onChange(async (value) => {
                            this.plugin.settings.eventTypes[index].prefix = value;
                            await this.plugin.saveSettings();
                        });
                });

            // Icon Setting (Dropdown)
            new Setting(settingRow)
                .setName('Icon')
                .addDropdown(dropdown => {
                    const iconOptions = this.plugin.settings.iconOptions.split(','); // Split Icon Options into an array
                    iconOptions.forEach(icon => {
                        dropdown.addOption(icon, icon); // Add each icon as an option
                    });
                    dropdown
                        .setValue(eventType.icon || '') // Set the current value
                        .onChange(async (value) => {
                            this.plugin.settings.eventTypes[index].icon = value;
                            await this.plugin.saveSettings();
                        });
                });

            // Up, Down, and Remove Buttons
            new Setting(settingRow)
                .addButton(button => button
                    .setIcon("arrow-up") // Up arrow
                    .setCta()
                    .setTooltip('Move Up')
                    .onClick(async () => {
                        if (index > 0) {
                            const temp = this.plugin.settings.eventTypes[index - 1];
                            this.plugin.settings.eventTypes[index - 1] = this.plugin.settings.eventTypes[index];
                            this.plugin.settings.eventTypes[index] = temp;
                            await this.plugin.saveSettings();
                            this.display();
                        }
                    }))
                .addButton(button => button
                    .setIcon("arrow-down") // Down arrow
                    .setCta()
                    .setTooltip('Move Down')
                    .onClick(async () => {
                        if (index < this.plugin.settings.eventTypes.length - 1) {
                            const temp = this.plugin.settings.eventTypes[index + 1];
                            this.plugin.settings.eventTypes[index + 1] = this.plugin.settings.eventTypes[index];
                            this.plugin.settings.eventTypes[index] = temp;
                            await this.plugin.saveSettings();
                            this.display();
                        }
                    }))
                .addButton(button => button
                    .setIcon("trash") // Trash can
                    .setCta()
                    .setTooltip('Remove')
                    .onClick(async () => {
                        this.plugin.settings.eventTypes.splice(index, 1);
                        await this.plugin.saveSettings();
                        this.display();
                    }));
        });

        // Add Event Type Button
        new Setting(containerEl)
            .addButton(button => button
                .setButtonText('Add Event Type')
                .setCta()
                .onClick(async () => {
                    this.plugin.settings.eventTypes.push({ display: '', prefix: '', icon: '' });
                    await this.plugin.saveSettings();
                    this.display();
                }));

        this.addWebsiteSection(containerEl);
        this.addCoffeeSection(containerEl);
    }

    private addWebsiteSection(containerEl: HTMLElement) {
        const websiteDiv = containerEl.createEl('div', { cls: 'website-section' });
        websiteDiv.style.display = 'flex';
        websiteDiv.style.alignItems = 'center';
        websiteDiv.style.marginTop = '20px';
        websiteDiv.style.marginBottom = '20px';
        websiteDiv.style.padding = '0.5rem';
        websiteDiv.style.opacity = '0.75';

        const logoLink = websiteDiv.createEl('a', {
            href: 'https://jots.life',
        });
        logoLink.setAttr('target', '_blank'); // Set the target attribute explicitly
        const logoImg = logoLink.createEl('img', {
            attr: {
                src: 'https://jots.life/jots-logo-512/',
                alt: 'JOTS Logo',
            },
        });
        logoImg.style.width = '64px';
        logoImg.style.height = '64px';
        logoImg.style.marginRight = '15px';

        websiteDiv.appendChild(logoLink);

        const descriptionDiv = websiteDiv.createEl('div', { cls: 'website-description' });
        descriptionDiv.innerHTML = `
            While Event Logger works on its own, it is part of a system called 
            <a href="https://jots.life" target="_blank">JOTS</a> that helps capture, organize, 
            and visualize your life's details.
        `;
        descriptionDiv.style.fontSize = '14px';
        descriptionDiv.style.lineHeight = '1.5';
        descriptionDiv.style.color = '#555';

        websiteDiv.appendChild(descriptionDiv);
        containerEl.appendChild(websiteDiv);
    }

    private addCoffeeSection(containerEl: HTMLElement) {
        const coffeeDiv = containerEl.createEl('div', { cls: 'buy-me-a-coffee' });
        coffeeDiv.style.marginTop = '20px';
        coffeeDiv.style.textAlign = 'center';

        coffeeDiv.innerHTML = `
            <a href="https://www.buymeacoffee.com/jpfieber" target="_blank">
                <img 
                    src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" 
                    alt="Buy Me A Coffee" 
                    style="height: 60px; width: 217px;"
                />
            </a>
        `;

        containerEl.appendChild(coffeeDiv);
    }
}