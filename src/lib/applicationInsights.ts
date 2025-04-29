import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { ClickAnalyticsPlugin } from '@microsoft/applicationinsights-clickanalytics-js';
import { createBrowserHistory } from 'history';

const browserHistory = createBrowserHistory();
const reactPlugin = new ReactPlugin();
const clickPlugin = new ClickAnalyticsPlugin();

const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APPINSIGHTS_CONNECTION_STRING,
    extensions: [reactPlugin, clickPlugin],
    extensionConfig: {
      [reactPlugin.identifier]: { history: browserHistory },
      [clickPlugin.identifier]: { 
        autoCapture: true,
        dataTags: {
          useDefaultContentNameOrId: true,
          customDataPrefix: 'data-'
        }
      }
    },
    enableAutoRouteTracking: true,
    disableFetchTracking: false,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
    autoTrackPageVisitTime: true,
    enableAjaxPerfTracking: true,
    enableAjaxErrorStatusText: true,
    enableUnhandledPromiseRejectionTracking: true,
    autoExceptionInstrumented: true,
    autoUnhandledPromiseInstrumented: true
  }
});

appInsights.loadAppInsights();

export { appInsights, reactPlugin };