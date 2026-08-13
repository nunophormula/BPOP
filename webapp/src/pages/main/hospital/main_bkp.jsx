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
          <Button
            size="medium"
            icon={<EyeOutlined />}
            onClick={() => {
              // Detalhes por agora não faz nada
            }}
          >
            Ver estatísticas
          </Button>
          <Button
            size="medium"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => navigate(`/app/hospital/${item.id}`)}
          >
            Ir para instituição
          </Button>
        </Space>
      ),
    }));
    setTableData(newArray);
  }

  return (
    <div>
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <p className="text-xl font-bold text-black">Lista de Instituições</p>
          <Button
            type="primary"
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
              title: "Representante(s)",
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
                          : `${record.responsaveis.length} responsáveis`}
                      </span>
                    </div>
                  )}
                </>
              ),
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
