import axios from "axios";
import { useContext, useEffect, useState } from "react";
import endpoints from "../../../utils/endpoints";
import { Context } from "../../../utils/context";
import { Button, DatePicker, Form, Input, InputNumber, Table } from "antd";
import dayjs from "dayjs";
import { AiOutlineFilter } from "react-icons/ai";
import { useNavigate } from "react-router";
import Create from "./create";

export default function Patients() {
  const { user } = useContext(Context);
  const [data, setData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [isOpenCreate, setIsOpenCreate] = useState(false);

  const [form] = Form.useForm();

  const navigate = useNavigate();

  useEffect(() => {
    getData();
  }, []);

  function getData() {
    axios
      .get(endpoints.patient.readByInstitution, {
        params: { INSTITUTION: user.ID_INSTITUTION },
      })
      .then((res) => {
        setData(res.data);
        prepareTableData(res.data);
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  }

  function prepareTableData(array) {
    let newArray = [];
    for (let i = 0; i < array.length; i++) {
      newArray.push({
        ...array[i],
        BIRTH_DATE: array[i].BIRTH_DATE
          ? dayjs(array[i].BIRTH_DATE).format("DD/MM/YYYY")
          : null,
        DETAILS: (
          <Button onClick={() => navigate(`/app/patient/${array[i].ID}`)}>
            Details
          </Button>
        ),
        FULL_DATA: array[i],
      });
    }

    setTableData(newArray);
  }

  function onSearch(_, allValues, array) {
    const columns = Object.keys(allValues);
    let searchData = array ?? data;
    for (let i = 0; i < columns.length; i++) {
      if (allValues[columns[i]]) {
        searchData = searchData.filter((item) => {
          if (item[`${columns[i]}`])
            return item[`${columns[i]}`]
              ?.toString()
              .match(allValues[columns[i]].toString());
        });
      }
    }

    prepareTableData(searchData);
  }

  return (
    <div>
      <div className="flex gap-8">
        <div className="w-4/5 flex flex-col">
          <div className="mb-2">
            <div className="flex justify-between">
              <p className="text-xl font-bold">Patients</p>
              <Button onClick={() => navigate("/app/patient/create")}>
                Create patient
              </Button>
            </div>
          </div>
          <Table
            columns={[
              { title: "ID", dataIndex: "ID", key: "ID" },
              {
                title: "Local Patient Log",
                dataIndex: "patient",
                key: "patient",
              },
              {
                title: "Birth date",
                dataIndex: "BIRTH_DATE",
                key: "BIRTH_DATE",
              },
              {
                title: "Acronyms name",
                dataIndex: "ACRONYMS_NAME",
                key: "ACRONYMS_NAME",
              },
              { title: "", dataIndex: "DETAILS", key: "DETAILS" },
            ]}
            dataSource={tableData}
          />
        </div>
        <div className="w-1/5">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xl font-bold">Search</p>
            <AiOutlineFilter className="text-xl" />
          </div>
          <div className="flex flex-col">
            <Form form={form} onValuesChange={onSearch}>
              <div className="bg-[#D5DCE1] p-2 rounded-[5px] mb-2">
                <p>ID</p>
              </div>
              <Form.Item name="ID">
                <InputNumber size="large" className="w-full!" />
              </Form.Item>
              <div className="bg-[#D5DCE1] p-2 rounded-[5px] mb-2">
                <p>Local Patient Log</p>
              </div>
              <Form.Item name="patient">
                <Input size="large" />
              </Form.Item>
              <div className="bg-[#D5DCE1] p-2 rounded-[5px] mb-2">
                <p>Birth Date</p>
              </div>
              <Form.Item name="BIRTH_DATE">
                <DatePicker
                  format={"DD/MM/YYYY"}
                  size="large"
                  className="w-full!"
                  placeholder="DD/MM/YYYY"
                />
              </Form.Item>
              <div className="bg-[#D5DCE1] p-2 rounded-[5px] mb-2">
                <p>Acronyms Name</p>
              </div>
              <Form.Item name="ACRONYMS_NAME">
                <Input size="large" />
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}
