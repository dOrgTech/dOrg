import React, { FC, useState } from "react";
import {
  DAOMigrationParams,
  DAOMigrationResult,
  getWeb3,
  DAOMigrationCallbacks,
  migrateDAO
} from "@dorgtech/daocreator-lib";
import { MDBContainer, MDBRow, MDBCol, MDBBtn } from "mdbreact";
import {
  LogUserApproval,
  LogInfo,
  LogError,
  LogTransactionResult,
  LogMigrationAborted,
  AnyLogLine
} from "./LogLineTypes";
import CreateOrganisation from "./CreateOrganisation";
import ConfigureOrganisation from "./ConfigureOrganisation";

interface IProps {
  dao: DAOMigrationParams;
  onComplete: (result: DAOMigrationResult) => void;
  onStart: () => void;
  onAbort: (error: Error) => void;
  onStop: () => void;
}

// Migrator Steps
enum STEP {
  Waiting,
  // Creating,
  // Configuring,
  Migrating, // This is what the Migrator gives, TODO potentially refactor for split
  Completed,
  Failed
}

// Possible state of each Tx
enum TX_STATE {
  Broadcasting, // Waiting to be signed
  Waiting, // Waiting to be mined
  Confirmed,
  Failed,
  Lost // If tx is taking an exceedingly long time
}

const Migrator: FC<IProps> = ({
  dao,
  onComplete,
  onStart,
  onAbort,
  onStop
}: IProps) => {
  /*
   * State
   */

  const [step, setStep] = useState(STEP.Waiting);
  // Contains transactions
  const [txList, setTxList] = useState({});
  // Whether or not there is a web3 instance(?)
  const [noWeb3Open, setNoWeb3Open] = useState(false);
  const [fullLogLines, setFullLogLines] = useState<AnyLogLine[]>([]);
  const [minimalLogLines, setMinimalLogLines] = useState([]);
  const [ethSpent, setEthSpent] = useState(0);
  const [result, setResult] = useState<DAOMigrationResult | undefined>(
    undefined
  );

  // Full state for localStorage
  const [state, setState] = useState({});

  const resetState = () => {
    setStep(STEP.Waiting);
    setTxList({});
    setNoWeb3Open(false);
  };

  const nextStep = () => {
    console.log("Go to next step");
    setStep(step => step++);
  };

  /*
   * Start
   */

  const startInstallation = async () => {
    console.log("Starting Installation");

    if (step !== STEP.Waiting) return;

    // Make sure we have a web3 provider available. If not,
    // tell the user they need to have one.
    let web3 = undefined;

    try {
      web3 = await getWeb3();
    } catch (e) {
      console.log(e);
    }

    if (!web3) {
      setNoWeb3Open(true);
      return;
    }

    // Alert in case of user closing window while deploying
    window.onbeforeunload = function() {
      return "Your migration is still in progress. Do you really want to leave?";
    };

    // Clear the log
    setFullLogLines([]);
    setMinimalLogLines([]);

    onStart(); // props

    const callbacks: DAOMigrationCallbacks = getCallbacks();
    setResult(undefined);
    setStep(STEP.Migrating);
    migrateDAO(dao, callbacks);

    // Result used to be set here and within onComplete in callbacks (onStop was similar)

    // nextStep();
  };

  /*
   * Callbacks
   */

  const addLogLine = (logLine: AnyLogLine) => {
    console.log(logLine);
  };

  const getCallbacks = () => {
    const callbacks: DAOMigrationCallbacks = {
      userApproval: (msg: string): Promise<boolean> =>
        new Promise<boolean>(resolve =>
          addLogLine(new LogUserApproval(msg, (resp: boolean) => resolve(resp)))
        ),

      info: (msg: string) => addLogLine(new LogInfo(msg)),

      error: (msg: string) => addLogLine(new LogError(msg)),

      txComplete: (msg: string, txHash: string, txCost: number) =>
        new Promise<void>(resolve => {
          setEthSpent(ethSpent => (ethSpent += Number(txCost)));
          addLogLine(new LogTransactionResult(msg, txHash, txCost));
          resolve();
        }),

      migrationAborted: (err: Error) => {
        addLogLine(new LogMigrationAborted(err));
        onAbort(err); // props

        setStep(STEP.Failed);
        onStop(); // props
      },

      migrationComplete: (result: DAOMigrationResult) => {
        window.onbeforeunload = function() {
          return undefined;
        };

        setResult(result);
        setStep(STEP.Completed);

        onComplete(result); // props
        onStop(); // props
      },

      getState: () => {
        const localState = localStorage.getItem("DAO_MIGRATION_STATE");

        if (localState) {
          return JSON.parse(localState);
        } else {
          return {};
        }
      },

      setState: (state: any) => {
        localStorage.setItem("DAO_MIGRATION_STATE", JSON.stringify(state));
      },

      cleanState: () => {
        localStorage.removeItem("DAO_MIGRATION_STATE");
      }
    };
    return callbacks;
  };

  const openAlchemy = () => {
    console.log("Open Alchemy");
  };

  return (
    <MDBContainer>
      <CreateOrganisation nextStep={nextStep} />
      <ConfigureOrganisation nextStep={nextStep} />

      {/* Install Organisation Button */}
      <MDBRow center>
        {step !== STEP.Completed ? (
          <MDBBtn
            disabled={step !== STEP.Waiting}
            onClick={() => startInstallation()}
          >
            Install Organisation
          </MDBBtn>
        ) : (
          <MDBBtn onClick={() => openAlchemy()}>Open Alchemy</MDBBtn>
        )}
      </MDBRow>
    </MDBContainer>
  );
};

export default Migrator;
