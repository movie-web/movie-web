import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useAsyncFn, useInterval } from "react-use";

import { sendPage } from "@/backend/extension/messaging";
import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { Loading } from "@/components/layout/Loading";
import { Stepper } from "@/components/layout/Stepper";
import { CenterContainer } from "@/components/layout/ThinContainer";
import { Heading2, Paragraph } from "@/components/utils/Text";
import { MinimalPageLayout } from "@/pages/layouts/MinimalPageLayout";
import {
  useNavigateOnboarding,
  useRedirectBack,
} from "@/pages/onboarding/onboardingHooks";
import { Card, Link } from "@/pages/onboarding/utils";
import { PageTitle } from "@/pages/parts/util/PageTitle";
import { conf } from "@/setup/config";
import {
  ExtensionDetectionResult,
  detectExtensionInstall,
} from "@/utils/detectFeatures";
import { getExtensionState } from "@/utils/extension";
import type { ExtensionStatus } from "@/utils/extension";

function RefreshBar() {
  const { t } = useTranslation();
  const reload = useCallback(() => {
    window.location.reload();
  }, []);
  return (
    <Card className="mt-4">
      <div className="flex items-center space-x-7">
        <p className="flex-1">{t("onboarding.extension.notDetecting")}</p>
        <Button theme="secondary" onClick={reload}>
          {t("onboarding.extension.notDetectingAction")}
        </Button>
      </div>
    </Card>
  );
}

export function ExtensionStatus(props: {
  status: ExtensionStatus;
  loading: boolean;
  showHelp?: boolean;
}) {
  const { t } = useTranslation();
  const [lastKnownStatus, setLastKnownStatus] = useState(props.status);
  useEffect(() => {
    if (!props.loading) setLastKnownStatus(props.status);
  }, [props.status, props.loading]);

  let content: ReactNode = null;
  if (props.loading || props.status === "unknown")
    content = (
      <>
        <Loading />
        <p>{t("onboarding.extension.status.loading")}</p>
      </>
    );
  if (props.status === "disallowed" || props.status === "noperms")
    content = (
      <>
        <p>{t("onboarding.extension.status.disallowed")}</p>
        <Button
          onClick={() => {
            sendPage({
              page: "PermissionGrant",
              redirectUrl: window.location.href,
            });
          }}
          theme="purple"
          padding="md:px-12 p-2.5"
          className="mt-6"
        >
          {t("onboarding.extension.status.disallowedAction")}
        </Button>
      </>
    );
  else if (props.status === "failed")
    content = <p>{t("onboarding.extension.status.failed")}</p>;
  else if (props.status === "outdated")
    content = <p>{t("onboarding.extension.status.outdated")}</p>;
  else if (props.status === "success")
    content = (
      <p className="flex items-center">
        <Icon icon={Icons.CHECKMARK} className="text-type-success mr-4" />
        {t("onboarding.extension.status.success")}
      </p>
    );
  return (
    <>
      <Card>
        <div className="flex py-6 flex-col space-y-2 items-center justify-center">
          {content}
        </div>
      </Card>
      {lastKnownStatus === "unknown" ? <RefreshBar /> : null}
      {props.showHelp && props.status !== "success" ? (
        <Card className="mt-4">
          <div className="flex items-center space-x-7">
            <Icon icon={Icons.WARNING} className="text-type-danger text-2xl" />
            <p className="flex-1">
              <Trans
                i18nKey="onboarding.extension.extensionHelp"
                components={{
                  bold: <span className="text-white" />,
                }}
              />
            </p>
          </div>
        </Card>
      ) : null}
    </>
  );
}

interface ExtensionPageProps {
  status: ExtensionStatus;
  loading: boolean;
}

function ChromeExtensionPage(props: ExtensionPageProps) {
  const { t } = useTranslation();
  const installLink = conf().ONBOARDING_CHROME_EXTENSION_INSTALL_LINK;
  return (
    <>
      <Heading2 className="!mt-0 !text-3xl max-w-[435px]">
        {t("onboarding.extension.title")}
      </Heading2>
      <Paragraph className="max-w-[320px] mb-4">
        {t("onboarding.extension.explainer")}
      </Paragraph>
      {installLink ? (
        <Link href={installLink} target="_blank" className="mb-12">
          {t("onboarding.extension.linkChrome")}
        </Link>
      ) : null}

      <ExtensionStatus status={props.status} loading={props.loading} />
    </>
  );
}

function FirefoxExtensionPage(props: ExtensionPageProps) {
  const { t } = useTranslation();
  const installLink = conf().ONBOARDING_FIREFOX_EXTENSION_INSTALL_LINK;
  return (
    <>
      <Heading2 className="!mt-0 !text-3xl max-w-[435px]">
        {t("onboarding.extension.title")}
      </Heading2>
      <Paragraph className="max-w-[320px] mb-4">
        {t("onboarding.extension.explainer")}
      </Paragraph>
      {installLink ? (
        <Link href={installLink} target="_blank" className="mb-12">
          {t("onboarding.extension.linkFirefox")}
        </Link>
      ) : null}

      <ExtensionStatus status={props.status} loading={props.loading} showHelp />
    </>
  );
}

function IosExtensionPage(_props: ExtensionPageProps) {
  const { t } = useTranslation();
  return (
    <>
      <Heading2 className="!mt-0 !text-3xl max-w-[435px]">
        {t("onboarding.extension.title")}
      </Heading2>
      <Paragraph className="max-w-[320px] mb-4">
        <Trans
          i18nKey="onboarding.extension.explainerIos"
          components={{ bold: <span className="text-white font-bold" /> }}
        />
      </Paragraph>
    </>
  );
}

function UnknownExtensionPage(props: ExtensionPageProps) {
  const { t } = useTranslation();
  const installChromeLink = conf().ONBOARDING_CHROME_EXTENSION_INSTALL_LINK;
  const installFirefoxLink = conf().ONBOARDING_FIREFOX_EXTENSION_INSTALL_LINK;
  return (
    <>
      <Heading2 className="!mt-0 !text-3xl max-w-[435px]">
        {t("onboarding.extension.title")}
      </Heading2>
      <Paragraph className="max-w-[320px] mb-4">
        {t("onboarding.extension.explainer")}
      </Paragraph>
      <div className="mb-4">
        {installChromeLink ? (
          <Link href={installChromeLink} target="_blank">
            {t("onboarding.extension.linkChrome")}
          </Link>
        ) : null}
      </div>
      <div className="mb-12">
        {installFirefoxLink ? (
          <Link href={installFirefoxLink} target="_blank">
            {t("onboarding.extension.linkFirefox")}
          </Link>
        ) : null}
      </div>

      <ExtensionStatus status={props.status} loading={props.loading} showHelp />
    </>
  );
}

export function OnboardingExtensionPage() {
  const { t } = useTranslation();
  const navigate = useNavigateOnboarding();
  const { completeAndRedirect } = useRedirectBack();
  const extensionSupport = useMemo(() => detectExtensionInstall(), []);

  const [{ loading, value }, exec] = useAsyncFn(
    async (triggeredManually: boolean = false) => {
      const status = await getExtensionState();
      if (status === "success" && triggeredManually) completeAndRedirect();
      return status;
    },
    [completeAndRedirect],
  );
  useInterval(exec, 1000);

  const componentMap: Record<
    ExtensionDetectionResult,
    typeof UnknownExtensionPage
  > = {
    chrome: ChromeExtensionPage,
    firefox: FirefoxExtensionPage,
    ios: IosExtensionPage,
    unknown: UnknownExtensionPage,
  };
  const PageContent = componentMap[extensionSupport];

  return (
    <MinimalPageLayout>
      <PageTitle subpage k="global.pages.onboarding" />
      <CenterContainer>
        <Stepper steps={2} current={2} className="mb-12" />
        <PageContent loading={loading} status={value ?? "unknown"} />
        <div className="flex justify-between items-center mt-8">
          <Button onClick={() => navigate("/onboarding")} theme="secondary">
            {t("onboarding.extension.back")}
          </Button>
          {value === "success" ? (
            <Button onClick={() => exec(true)} theme="purple">
              {t("onboarding.extension.submit")}
            </Button>
          ) : null}
        </div>
      </CenterContainer>
    </MinimalPageLayout>
  );
}
