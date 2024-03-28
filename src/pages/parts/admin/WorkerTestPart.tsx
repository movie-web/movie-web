import classNames from "classnames";
import { useMemo, useState } from "react";
import { useAsyncFn } from "react-use";

import { singularProxiedFetch } from "@/backend/helpers/fetch";
import { Button } from "@/components/buttons/Button";
import { Icon, Icons } from "@/components/Icon";
import { Box } from "@/components/layout/Box";
import { Divider } from "@/components/utils/Divider";
import { Heading2 } from "@/components/utils/Text";
import { getProxyUrls } from "@/utils/proxyUrls";

export function WorkerItem(props: {
  name: string;
  errored?: boolean;
  success?: boolean;
  errorText?: string;
}) {
  return (
    <div className="flex mb-2">
      <Icon
        icon={
          props.errored
            ? Icons.WARNING
            : props.success
              ? Icons.CIRCLE_CHECK
              : Icons.EYE_SLASH
        }
        className={classNames({
          "text-xl mr-2 mt-0.5": true,
          "text-video-scraping-error": props.errored,
          "text-video-scraping-noresult": !props.errored && !props.success,
          "text-video-scraping-success": props.success,
        })}
      />
      <div className="flex-1">
        <p className="text-white font-bold">{props.name}</p>
        {props.errorText ? <p>{props.errorText}</p> : null}
      </div>
    </div>
  );
}

export function WorkerTestPart() {
  const workerList = useMemo(() => {
    return getProxyUrls().map((v, ind) => ({
      id: ind.toString(),
      url: v,
    }));
  }, []);
  const [workerState, setWorkerState] = useState<
    { id: string; status: "error" | "success"; error?: Error }[]
  >([]);

  const [buttonDisabled, setButtonDisabled] = useState(false);

  const [testState, runTests] = useAsyncFn(async () => {
    setButtonDisabled(true);
    function updateWorker(id: string, data: (typeof workerState)[number]) {
      setWorkerState((s) => {
        return [...s.filter((v) => v.id !== id), data];
      });
    }
    setWorkerState([]);

    const workerPromises = workerList.map(async (worker) => {
      try {
        if (worker.url.endsWith("/")) {
          updateWorker(worker.id, {
            id: worker.id,
            status: "error",
            error: new Error("URL ends with slash"),
          });
          return;
        }
        await singularProxiedFetch(
          worker.url,
          "https://postman-echo.com/get",
          {},
        );
        updateWorker(worker.id, {
          id: worker.id,
          status: "success",
        });
      } catch (err) {
        const error = err as Error;
        error.message = error.message.replace(worker.url, "WORKER_URL");
        updateWorker(worker.id, {
          id: worker.id,
          status: "error",
          error,
        });
      }
    });

    await Promise.all(workerPromises);
    setTimeout(() => setButtonDisabled(false), 5000);
  }, [workerList, setWorkerState]);

  return (
    <>
      <Heading2 className="!mb-0 mt-12">Worker tests</Heading2>
      <p className="mb-8 mt-2">{workerList.length} worker(s) registered</p>
      <Box>
        {workerList.map((v, i) => {
          const s = workerState.find((segment) => segment.id === v.id);
          const name = `Worker ${i + 1}`;
          if (!s) return <WorkerItem name={name} key={v.id} />;
          if (s.status === "error")
            return (
              <WorkerItem
                name={name}
                errored
                key={v.id}
                errorText={s.error?.toString()}
              />
            );
          if (s.status === "success")
            return <WorkerItem name={name} success key={v.id} />;
          return <WorkerItem name={name} key={v.id} />;
        })}
        <Divider />
        <div className="flex justify-end">
          <Button
            theme="purple"
            loading={testState.loading}
            onClick={buttonDisabled ? undefined : runTests}
            disabled={buttonDisabled}
          >
            Test workers
          </Button>
        </div>
      </Box>
    </>
  );
}
