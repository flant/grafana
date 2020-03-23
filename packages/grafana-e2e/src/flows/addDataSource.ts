import { e2e } from '../index';
import { fromBaseUrl, getDataSourceId } from '../support/url';

export interface DataSourceConfig {
  alertMessage: string;
  beforeSubmit: Function;
  name: string;
}

const DEFAULT_DATA_SOURCE_CONFIG: DataSourceConfig = {
  alertMessage: 'Data source is working',
  beforeSubmit: () => {},
  name: 'TestData DB',
};

export const addDataSource = (config: Partial<DataSourceConfig> = {}): string => {
  const { alertMessage, beforeSubmit, name } = { ...DEFAULT_DATA_SOURCE_CONFIG, ...config };

  e2e().logToConsole('Adding data source with name:', name);
  e2e.pages.AddDataSource.visit();
  e2e.pages.AddDataSource.dataSourcePlugins(name)
    .scrollIntoView()
    .should('be.visible') // prevents flakiness
    .click();

  const dataSourceName = `e2e-${Date.now()}`;
  e2e.pages.DataSource.name().clear();
  e2e.pages.DataSource.name().type(dataSourceName);
  beforeSubmit();
  e2e.pages.DataSource.saveAndTest().click();
  e2e.pages.DataSource.alert().should('exist');
  e2e.pages.DataSource.alertMessage().should('contain.text', alertMessage);
  e2e().logToConsole('Added data source with name:', dataSourceName);

  e2e()
    .url()
    .then((url: string) => {
      const dataSourceId = getDataSourceId(url);

      e2e.setScenarioContext({
        lastAddedDataSource: dataSourceName,
        lastAddedDataSourceId: dataSourceId,
      });

      const healthUrl = fromBaseUrl(`/api/datasources/${dataSourceId}/health`);
      e2e().logToConsole(`Fetching ${healthUrl}`);
      e2e()
        .request(healthUrl)
        .its('body')
        .should('have.property', 'status')
        .and('eq', 'OK');
    });

  return dataSourceName;
};
