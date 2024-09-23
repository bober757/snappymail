import { FilterModel } from 'Sieve/Model/Filter';
import { SieveScriptModel } from 'Sieve/Model/Script';

import { FilterPopupView } from 'Sieve/View/Filter';

import { parseScript } from 'Sieve/Parser';

import { availableActions, availableControls, availableTests } from 'Sieve/Commands';

import { ControlCommand, TestCommand, ActionCommand, GrammarComment } from 'Sieve/Grammar';

import {
	capa,
	scripts,
	getNotification,
	Remote
} from 'Sieve/Utils';

export class SieveScriptPopupView extends rl.pluginPopupView {
	constructor() {
		super('SieveScript');

		this.addObservables({
			saveError: false,
			errorText: '',
			rawActive: false,
			script: null,
			saving: false,

			sieveCapabilities: '',
			availableActions: '',
			availableControls: '',
			availableTests: ''
		});

		this.filterForDeletion = ko.observable(null).askDeleteHelper();
	}

	validateScript() {
		try {
			this.errorText('');
			parseScript(this.script().body());
		} catch (e) {
			this.errorText(e.message);
		}
	}

	saveScript() {
		let self = this,
			script = self.script();
		if (!self.saving()/* && script.hasChanges()*/) {
			this.errorText('');
			self.saveError(false);

			if (!script.verify()) {
				return;
			}

			if (!script.exists() && scripts.find(item => item.name() === script.name())) {
				script.nameError(true);
				return;
			}

			try {
				parseScript(script.body());
			} catch (e) {
				this.errorText(e.message);
				return;
			}

			self.saving(true);

			if (script.allowFilters()) {
				script.body(script.filtersToRaw());
			}

			Remote.request('FiltersScriptSave',
				(iError, data) => {
					self.saving(false);

					if (iError) {
						self.saveError(true);
						self.errorText(data?.messageAdditional || getNotification(iError));
					} else {
						script.exists() || scripts.push(script);
						script.exists(true);
						script.hasChanges(false);
//						this.close();
					}
				},
				script.toJSON()
			);
		}
	}

	deleteFilter(filter) {
		this.script().filters.remove(filter);
	}

	addFilter() {
		/* this = SieveScriptModel */
		const filter = new FilterModel();
		filter.generateID();
		FilterPopupView.showModal([
			filter,
			() => this.filters.push(filter.assignTo())
		]);
	}

	editFilter(filter) {
		const clonedFilter = filter.assignTo();
		FilterPopupView.showModal([
			clonedFilter,
			() => {
				clonedFilter.assignTo(filter);
				const script = this.script();
				script.hasChanges(script.body() != script.filtersToRaw());
			},
			true
		]);
	}

	toggleFiltersRaw() {
		const script = this.script(), notRaw = !this.rawActive();
		notRaw && script.body(script.filtersToRaw());
		this.rawActive(notRaw);
	}

	onBuild(oDom) {
		oDom.addEventListener('click', event => {
			const el = event.target.closestWithin('td.e-action', oDom),
				filter = el && ko.dataFor(el);
			filter && this.editFilter(filter);
		});
	}

	templateName(obj) {
		const id = 'Sieve' + obj.constructor.name;
		return document.getElementById(id) ? id : 'SieveCommand';
	}

	styleClass(obj) {
		if (obj instanceof ControlCommand) {
			return 'sieve-control';
		}
		if (obj instanceof TestCommand) {
			return 'sieve-test';
		}
		if (obj instanceof ActionCommand) {
			return 'sieve-action';
		}
		if (obj instanceof GrammarComment) {
			return 'sieve-comment';
		}
/*
		if (obj instanceof GrammarString) {
			return 'sieve-string';
		}
		if (obj instanceof GrammarCommand) {
			return 'sieve-command';
		}
		if (obj instanceof GrammarCommands) {
			return 'sieve-commands';
		}
		if (obj instanceof GrammarTestList {
			return 'sieve-testlist';
		}
		if (obj instanceof GrammarBracketComment {
			return 'sieve-bcomment';
		}
		if (obj instanceof GrammarHashComment {
			return 'sieve-hcomment';
		}
		if (obj instanceof GrammarNumber {
			return 'sieve-number';
		}
		if (obj instanceof GrammarStringList {
			return 'sieve-stringlist';
		}
		if (obj instanceof GrammarQuotedString {
			return 'sieve-qstring';
		}
		if (obj instanceof GrammarMultiLine {
			return 'sieve-multiline';
		}
		if (obj instanceof UnknownCommand {
			return 'sieve-string';
		}
*/
		return 'sieve-' + obj.constructor.name;
	}

	beforeShow(oScript) {
//	onShow(oScript) {
		this.sieveCapabilities(capa.join(' '));
		this.availableActions([...Object.keys(availableActions())].join(', '));
		this.availableControls([...Object.keys(availableControls())].join(', '));
		this.availableTests([...Object.keys(availableTests())].join(', '));

		oScript = oScript || new SieveScriptModel();
		this.script(oScript);
		this.rawActive(!oScript.allowFilters());
		this.saveError(false);
		this.errorText('');

/*
		// TODO: Sieve GUI
		let tree = parseScript(oScript.body(), oScript.name());
		console.dir(tree);
		console.log(tree.join('\r\n'));
*/
	}
}
