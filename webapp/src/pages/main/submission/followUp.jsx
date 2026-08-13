import axios from "axios";
import { useContext, useEffect, useState } from "react";
import endpoints from "../../../utils/endpoints";
import { Context } from "../../../utils/context";
import { Button, DatePicker, Form, Input, InputNumber, Table } from "antd";
import dayjs from "dayjs";
import { AiOutlineFilter } from "react-icons/ai";
import { useNavigate } from "react-router";
import Create from "./create";
import FollowUpForm from "../../../components/form/followUp";

export default function FollowUp({ data }) {
  const { user } = useContext(Context);
  const [tableData, setTableData] = useState([]);
  const [selected, setSelected] = useState({});

  const [form] = Form.useForm();

  const navigate = useNavigate();

  useEffect(() => {
    console.log(data);
    prepareData(data.followUps);
  }, []);

  function prepareData(values) {
    const aux = [];
    for (let i = 0; i < values.length; i++) {
      aux.push({
        ...values[i],
        DETAILS: (
          <div className="flex justify-center items-end">
            <Button onClick={() => selectFollowUp(values[i].ID)}>Details</Button>
          </div>
        ),
      });
    }

    setTableData(aux);
  }

  function selectFollowUp(id) {
    setSelected(data.followUps.filter((item) => item.ID === id)[0]);
  }

  function clearSelect() {
    setSelected({});
  }

  return (
    <div className="flex flex-col">
      {Object.keys(selected).length > 0 ? (
        <FollowUpForm initialValues={selected} clearSelect={clearSelect} />
      ) : (
        <Table
          columns={[
            { title: "Date", dataIndex: "SCOPE_DATE", key: "SCOPE_DATE" },
            {
              title: (
                <div className="flex justify-end">
                  <Button onClick={() => navigate("/app/patient/create-follow-up")}>Create Follow-up</Button>
                </div>
              ),
              dataIndex: "DETAILS",
              key: "DETAILS",
            },
          ]}
          dataSource={tableData}
        />
      )}
    </div>
  );
}
