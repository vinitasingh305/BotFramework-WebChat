import { Condition } from 'selenium-webdriver';

import { imageSnapshotOptions, timeouts } from './constants.json';
import minNumActivitiesShown from './setup/conditions/minNumActivitiesShown';
import runHook from './setup/pageObjects/runHook';
import uiConnected from './setup/conditions/uiConnected';

// selenium-webdriver API doc:
// https://seleniumhq.github.io/selenium/docs/api/javascript/module/selenium-webdriver/index_exports_WebDriver.html

jest.setTimeout(timeouts.test);

function expectLanguage(expected) {
  return new Condition(`language changed to "${expected}"`, async driver => {
    const [language] = await runHook(driver, 'useLanguage');

    return language === expected;
  });
}

test('update timestamp on-the-fly', async () => {
  const { driver, pageObjects } = await setupWebDriver();

  await driver.wait(uiConnected(), timeouts.directLine);
  await pageObjects.sendMessageViaSendBox('echo Hello, World!', { waitForSend: true });

  await driver.wait(minNumActivitiesShown(2), timeouts.directLine);

  expect(await driver.takeScreenshot()).toMatchImageSnapshot(imageSnapshotOptions);

  await pageObjects.updateProps({ locale: 'zh-HK' });
  await driver.wait(expectLanguage('zh-HK'), timeouts.ui);

  expect(await driver.takeScreenshot()).toMatchImageSnapshot(imageSnapshotOptions);

  await pageObjects.updateProps({ locale: 'zh-YUE' });
  await driver.wait(expectLanguage('zh-YUE'), timeouts.ui);

  expect(await driver.takeScreenshot()).toMatchImageSnapshot(imageSnapshotOptions);
});

test('timestamp should update time', async () => {
  const { driver, pageObjects } = await setupWebDriver({
    setup: () =>
      Promise.all([
        window.WebChatTest.loadScript('https://unpkg.com/core-js@2.6.3/client/core.min.js'),
        window.WebChatTest.loadScript('https://unpkg.com/lolex@4.0.1/lolex.js')
      ]).then(() => {
        window.WebChatTest.clock = lolex.install();
      })
  });

  await pageObjects.sendMessageViaSendBox('echo timestamp', { waitForSend: true });

  await driver.wait(minNumActivitiesShown(3), timeouts.directLine);

  await driver.executeScript(() => {
    window.WebChatTest.clock.tick(330000); // t = 5.5 minutes
  });

  expect(await driver.takeScreenshot()).toMatchImageSnapshot(imageSnapshotOptions);
});
