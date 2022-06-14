'use strict';
const St = imports.gi.St;
const Gio = imports.gi.Gio;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

class Extension {
    constructor() {
        this._MIRROR_SCHEMA = 'org.gnome.desktop.remote-desktop.rdp';
        this._MIRROR_SETTINGS_KEY = 'screen-share-mode';
        this._MIRROR_ENABLED_KEY = 'enable';
        this._MIRROR_SCREEN = 'mirror-primary';
        this._MIRROR_EXTEND_SCREEN = 'extend';
        this._ICON_EXTEND = 'extend';
        this._ICON_MIRROR = 'mirror';
        this._indicator = null;
        this._mirrorSetting = null;
        this._icon = null;
    }

    enable() {
        log(`enabling ${Me.metadata.name}`);
        this._initMirrorSettingsObject();

        let indicatorName = `${Me.metadata.name} Indicator`;

        this._indicator = new PanelMenu.Button(0.0, indicatorName, false);

        this._initIcon();
        this._indicator.add_child(this._icon);
        this._indicator.connect('button-press-event', this._onClick.bind(this));
        this._indicator.connect('touch-event', this._onClick.bind(this));

        Main.panel.addToStatusArea(indicatorName, this._indicator);
    }

    disable() {
        log(`disabling ${Me.metadata.name}`);

        this._destroyMirrorSettingsObject();
        this._indicator.destroy();
        this._indicator = null;
    }

    _initMirrorSettingsObject() {
        this._mirrorSetting = new Gio.Settings({ schema: this._MIRROR_SCHEMA });
    }

    _destroyMirrorSettingsObject() {
        this._mirrorSetting = null;
    }

    _getCurrentSettingsValue() {
        return this._mirrorSetting.get_string(this._MIRROR_SETTINGS_KEY)
    }

    _setSettingsValue(value) {
        this._mirrorSetting.set_string(this._MIRROR_SETTINGS_KEY, value);
        Gio.Settings.sync();
    }

    _restartMirroringIfNeeded() {
        const isEnabled = this._mirrorSetting.get_boolean(this._MIRROR_ENABLED_KEY);
        if (!isEnabled) {
            return;
        }

        this._mirrorSetting.set_boolean(this._MIRROR_ENABLED_KEY, false);
        Gio.Settings.sync();
        this._mirrorSetting.set_boolean(this._MIRROR_ENABLED_KEY, true);
        Gio.Settings.sync();
    }

    _onClick() {
        const current = this._getCurrentSettingsValue();

        switch (current) {
            case this._MIRROR_SCREEN:
                this._switchToExtended();
                break;
            case this._MIRROR_EXTEND_SCREEN:
                this._switchToMirror();
                break;
            default:
                log(`unknown value: ${current}`);
        }
    }

    _switchToMirror() {
        this._setSettingsValue(this._MIRROR_SCREEN);
        this._setIcon(this._ICON_MIRROR);
    }

    _switchToExtended() {
        this._setSettingsValue(this._MIRROR_EXTEND_SCREEN);
        this._setIcon(this._ICON_EXTEND);
    }

    _setIcon(value) {
        this._icon.gicon = Gio.icon_new_for_string(`${Me.path}/icons/${value}.svg`);
    }

    _initIcon() {
        this._icon = new St.Icon({
            style_class: 'system-status-icon'
        });

        const current = this._getCurrentSettingsValue();

        if (current === this._MIRROR_SCREEN) {
            this._setIcon(this._ICON_MIRROR);
        } else {
            this._setIcon(this._ICON_EXTEND);
        }
    }
}


function init() {
    log(`initializing ${Me.metadata.name}`);

    return new Extension();
}