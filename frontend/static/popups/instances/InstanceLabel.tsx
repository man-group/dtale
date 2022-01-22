import * as React from 'react';

import { Instance } from '../../repository/InstanceRepository';

/** Component properties for InstanceLabel */
interface InstanceLabelProps {
  instance: Instance;
}

export const InstanceLabel: React.FC<InstanceLabelProps> = ({ instance }) => (
  <span className="d-inline text-nowrap">
    {`${instance.data_id}${instance.name ? ` - ${instance.name}` : ''} (${instance.start})`}
  </span>
);
