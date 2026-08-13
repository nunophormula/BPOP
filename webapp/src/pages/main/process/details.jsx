import axios from "axios";
import { useCallback, useContext, useEffect, useState } from "react";
import endpoints from "../../../utils/endpoints";
import { Context } from "../../../utils/context";
import {
  Button,
  Checkbox,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Select,
  Table,
  Tabs,
} from "antd";
import dayjs from "dayjs";
import {
  AiOutlineDelete,
  AiOutlineFilter,
  AiOutlinePlus,
} from "react-icons/ai";
import { useParams } from "react-router";
import helpers from "../../../utils/helpers";
import { debounce } from "lodash";
import Investigations from "../../../components/form/investigations";
import ScopeAtWeek0 from "../../../components/form/scopeAtWeek0";
import FollowUp from "./followUp";
import PersonalInformation from "../../../components/form/personalInformation";

export default function Details() {
  const { user } = useContext(Context);
  const [data, setData] = useState({});

  const params = useParams();

  useEffect(() => {
    getData();
  }, []);

  function getData() {
    if (params.ID) {
      axios
        .get(endpoints.patient.readById, {
          params: { ID: params.ID },
        })
        .then((res) => {
          setData(res.data);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }

  return (
    <div>
      {Object.keys(data).length > 0 && (
        <div className="flex flex-col">
          <p className="text-xl font-bold">
            Patient: {data.patient[0]?.patient} | ID: {data.patient[0]?.ID}
          </p>
          <Tabs
            className="mt-4! patient-tabs"
            size="large"
            tabPosition="left"
            type="card"
            defaultActiveKey="personal-information"
            items={[
              {
                label: `Personal Information`,
                key: "personal-information",
                children: <PersonalInformation initialValues={data} />,
              },
              {
                label: `Symptoms`,
                key: "symptoms",
                children: <Symptoms initialValues={data} />,
              },
              {
                label: `Scope at week 0`,
                key: "scope",
                children: <ScopeAtWeek0 initialValues={data} />,
              },
              {
                label: `Investigations`,
                key: "investigations",
                children: <Investigations initialValues={data} />,
              },
              {
                label: `Follow Up`,
                key: "followUp",
                children: <FollowUp data={data} />,
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}
