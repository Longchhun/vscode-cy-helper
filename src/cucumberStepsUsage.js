const { window } = require('vscode');
const _ = require('lodash');
const {
  composeUsageReport,
  parseFeatures,
  calculateUsage,
  stepDefinitionPath
} = require('./parser/Gherkin');
const { showQuickPickMenu, show } = require('./helper/utils');
const { message, regexp } = require('./helper/constants');

const findUnusedCucumberSteps = () => {
  const usages = composeUsageReport();
  const unused = usages.filter(u => u.matches === 0);

  showQuickPickMenu(unused, {
    mapperFunction: c => {
      return {
        label: c.step,
        detail: `${c.path.split(stepDefinitionPath)[1].replace('.js', '')}:${
          c.loc.line
        }`,
        data: c
      };
    },
    header: message.UNUSED_STEPS_FOUND(unused.length),
    notFoundMessage: message.UNUSED_STEPS_NOT_FOUND
  });
};

const findCucumberStepUsage = () => {
  const editor = window.activeTextEditor;
  const path = editor.document.fileName;

  const { text: line, range } = editor.document.lineAt(
    editor.selection.active.line
  );

  const stepDefinitionPattern = regexp.STEP_DEFINITION;
  const stepLiteralMatch = line.replace('/', '|').match(stepDefinitionPattern);

  !stepLiteralMatch && show('warn', message.NO_STEP);

  const stepLiteral = stepLiteralMatch[0].replace(regexp.QUOTES, '');
  const stepDefinition = [
    {
      [stepLiteral]: {
        path: path,
        loc: range.start
      }
    }
  ];

  const features = parseFeatures();
  const stats = calculateUsage(features, stepDefinition);
  const usages = _.get(stats, '0.usage') || [];

  showQuickPickMenu(usages, {
    mapperFunction: c => {
      return {
        label: c.step,
        detail: `${c.path.split('/cypress/')[1]}:${c.loc.line}`,
        data: c
      };
    },
    header: message.REFERENCE_STEPS_FOUND(usages.length, stepLiteral),
    notFoundMessage: message.REFERECE_STEPS_NOT_FOUND(stepLiteral)
  });
};

module.exports = {
  findUnusedCucumberSteps,
  findCucumberStepUsage
};
