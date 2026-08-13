import axios from "axios";
import { useContext, useEffect, useState } from "react";
import endpoints from "../../../utils/endpoints";
import { Context } from "../../../utils/context";
import { Button, Table, Space, Avatar, Tooltip } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router";

export default function Hospitals() {
  const { user } = useContext(Context);
  const [data, setData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getData();
  }, []);

  function getData() {
    axios
      .get(endpoints.hospital.read)
      .then((res) => {
        const { hospitais, resp_hospitalares } = res.data;

        console.log(resp_hospitalares);

        const hospitaisAgrupados = hospitais.map((h) => ({
          ...h,
          responsaveis: resp_hospitalares.filter((r) => r.hospital_id == h.id),
        }));

        setData(hospitaisAgrupados);
        prepareTableData(hospitaisAgrupados);
      })
      .catch((err) => console.log(err));
  }

  function prepareTableData(array) {
    const newArray = array.map((item) => ({
      ...item,
      ACTIONS: (
        <Space>
          <Tooltip title="Ver instituição">
            <Button
              size="medium"
              className="!text-[#F5702B] !bg-transparent !rounded-[50px] !h-[40px] !w-[40px] hover:!bg-[#F5702B] hover:!text-[#FFF]"
              type="primary"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/app/hospital/${item.id}`)}
            ></Button>
          </Tooltip>
        </Space>
      ),
    }));
    setTableData(newArray);
  }

  return (
    <div>
      <div className="flex flex-col gap-6 p-2">
        <div className="flex justify-between items-center">
          <p className="text-xl font-bold text-black">Lista de Instituições</p>
          <Button
            type="primary"
            className="!bg-[#F5702B] !rounded-[29px] !h-[40px] hover:!bg-transparent hover:!text-[#F5702B]"
            onClick={() => navigate("/app/hospital/create")}
            icon={<PlusOutlined />}
          >
            Criar instituição
          </Button>
        </div>

        <Table
          columns={[
            { title: "Nome", dataIndex: "nome", key: "nome" },
            { title: "Email", dataIndex: "email", key: "email" },
            { title: "Telefone", dataIndex: "telefone", key: "telefone" },
            {
              title: "Utilizadores",
              key: "responsavel",
              render: (_, record) => (
                <>
                  {record.responsaveis?.length > 0 && (
                    <div className="flex items-center gap-3">
                      <Avatar.Group max={{ count: 3 }}>
                        {record.responsaveis.map((resp) => (
                          <Tooltip key={resp.id} title={resp.nome}>
                            <Avatar icon={<UserOutlined />}>
                              {resp.nome?.charAt(0)}
                            </Avatar>
                          </Tooltip>
                        ))}
                      </Avatar.Group>

                      <span className="text-gray-700">
                        {record.responsaveis.length === 1
                          ? record.responsaveis[0].nome
                          : `${record.responsaveis.length} utilizadores`}
                      </span>
                    </div>
                  )}
                </>
              ),
            },
            {
              title: "Nº de submissões",
              dataIndex: "total_submissoes",
              key: "total_submissoes",
              sorter: (a, b) =>
                (a.total_submissoes || 0) - (b.total_submissoes || 0),
            },
            { title: "Ações", dataIndex: "ACTIONS", key: "ACTIONS" },
          ]}
          dataSource={tableData}
          rowKey="ID"
        />
      </div>
    </div>
  );
}
