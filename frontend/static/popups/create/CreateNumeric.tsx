import { TFunction } from 'i18next';
import * as React from 'react';
import { withTranslation, WithTranslation } from 'react-i18next';

import ButtonToggle from '../../ButtonToggle';
import { capitalize } from '../../stringUtils';

import { CreateColumnCodeSnippet } from './CodeSnippet';
import {
  BaseCreateComponentProps,
  CreateColumnType,
  NumericConfig,
  NumericOperationType,
  OperandDataType,
} from './CreateColumnState';
import { default as Operand, OperandState } from './Operand';

export const validateNumericCfg = (t: TFunction, cfg: NumericConfig): string | undefined => {
  if (!cfg.operation) {
    return t('Please select an operation!') ?? undefined;
  }
  if (cfg.left.type === OperandDataType.COL && !cfg.left.col) {
    return t('Left side is missing a column selection!') ?? undefined;
  } else if (cfg.left.type === OperandDataType.VAL && !cfg.left.val) {
    return t('Left side is missing a static value!') ?? undefined;
  }
  if (cfg.right.type === OperandDataType.COL && !cfg.right.col) {
    return t('Right side is missing a column selection!') ?? undefined;
  } else if (cfg.right.type === OperandDataType.VAL && !cfg.right.val) {
    return t('Right side is missing a static value!') ?? undefined;
  }
  return undefined;
};

const OPERATION_MAPPING: { [k in NumericOperationType]?: string } = {
  sum: ' + ',
  difference: ' - ',
  multiply: ' * ',
  divide: ' / ',
};

export const buildCode = (cfg: NumericConfig): CreateColumnCodeSnippet => {
  let code = '';
  if (cfg.left.type === OperandDataType.COL) {
    const col = cfg.left.col;
    if (!col) {
      return undefined;
    }
    code += `df['${col}']`;
  } else {
    if (!cfg.left.val) {
      return undefined;
    }
    code += cfg.left.val;
  }
  if (!cfg.operation) {
    return undefined;
  }
  code += OPERATION_MAPPING[cfg.operation];
  if (cfg.right.type === OperandDataType.COL) {
    const col = cfg.right.col;
    if (!col) {
      return undefined;
    }
    code += `df['${col}']`;
  } else {
    if (!cfg.right.val) {
      return undefined;
    }
    code += cfg.right.val;
  }
  return code;
};

const CreateNumeric: React.FC<BaseCreateComponentProps & WithTranslation> = ({ columns, updateState, t }) => {
  const [left, setLeft] = React.useState<OperandState>({ type: OperandDataType.COL });
  const [right, setRight] = React.useState<OperandState>({ type: OperandDataType.COL });
  const [operation, setOperation] = React.useState<NumericOperationType>();

  React.useEffect(() => {
    const cfg: NumericConfig = {
      left: {
        type: left.type,
        col: left.type === OperandDataType.COL ? left.col?.value : undefined,
        val: left.type === OperandDataType.VAL ? left.val : undefined,
      },
      right: {
        type: right.type,
        col: right.type === OperandDataType.COL ? right.col?.value : undefined,
        val: right.type === OperandDataType.VAL ? right.val : undefined,
      },
      operation,
    };
    updateState({ cfg: { type: CreateColumnType.NUMERIC, cfg }, code: buildCode(cfg) });
  }, [left, right, operation]);

  return (
    <React.Fragment>
      <div className="form-group row">
        <label className="col-md-3 col-form-label text-right">{t('Operation')}</label>
        <div className="col-md-8">
          <ButtonToggle
            options={Object.values(NumericOperationType).map((value) => ({ value, label: capitalize(value) }))}
            update={setOperation}
            defaultValue={operation}
            compact={false}
          />
        </div>
      </div>
      <Operand
        name="left"
        cfg={left}
        otherOperand={right}
        dataType="number"
        colTypes={['int', 'float']}
        updateState={(updates) => setLeft({ ...left, ...updates.left })}
        columns={columns}
      />
      <Operand
        name="right"
        cfg={right}
        otherOperand={left}
        dataType="number"
        colTypes={['int', 'float']}
        updateState={(updates) => setRight({ ...right, ...updates.right })}
        columns={columns}
      />
    </React.Fragment>
  );
};

export default withTranslation('builders')(CreateNumeric);
