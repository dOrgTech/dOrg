import React, { FC } from "react";
import { AnyField } from "@dorgtech/daocreator-lib";
import FormField from "../FormField";
import { MDBRow } from "mdbreact";

interface Props {
  fields: AnyField[];
  editable: boolean;
}

const VotingMachineEditor: FC<Props> = ({ fields, editable }) => (
  <>
    {fields.map((field: AnyField, index: number) => {
      if (index <= 3) {
        return (
          <FormField
            field={field}
            editable={editable}
            key={`genproto-field-${index}`}
          />
        );
      } else if (index % 2 !== 0) {
        return (
          <MDBRow key={`genproto-field-${index}`}>
            <FormField field={field} editable={editable} />
            <FormField field={fields[index - 1]} editable={editable} />
          </MDBRow>
        );
      }
      // Unhandled paramNames
      console.log("UNEXPECTED PARAM");
      return (
        <FormField
          field={field}
          editable={editable}
          key={`genproto-field-${index}`}
        />
      );
    })}
  </>
);

export default VotingMachineEditor;