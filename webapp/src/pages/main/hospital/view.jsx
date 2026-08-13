import { useState, useEffect, useContext } from "react";
import { Button, Card, Row, Col, Table } from "antd";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import endpoints from "../../../utils/endpoints";
import { Context } from "../../../utils/context";
import { useHospitalId, useHospitalBasePath } from "../../../utils/hospitalId";

import {
  ArrowLeftOutlined,
  DatabaseOutlined,
  SettingOutlined,
  UserOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { PieChart } from "@mui/x-charts";

const distritosPT = [
  "Aveiro",
  "Beja",
  "Braga",
  "Bragança",
  "Castelo Branco",
  "Coimbra",
  "Évora",
  "Faro",
  "Guarda",
  "Leiria",
  "Lisboa",
  "Portalegre",
  "Porto",
  "Santarém",
  "Setúbal",
  "Viana do Castelo",
  "Vila Real",
  "Viseu",
];

export default function HospitalView() {
  const navigate = useNavigate();
  const { user } = useContext(Context);
  const ID = useHospitalId();
  const basePath = useHospitalBasePath();

  const [hospitalName, setHospitalName] = useState("");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    hospitals: 0,
    submissions: 0,
    submissionsToday: 0,
    users: 0,
    recentSubmissions: [],
    districts: [],
    topPlatforms: [],
    topProducts: [],
    topClones: [],
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);

        const [
          hospitalsRes,
          submissionsRes,
          submissionsTodayRes,
          usersRes,
          recentSubmissionsRes,
          districtsRes,
          topPlatformsRes,
          topProductsRes,
          topClonesRes,
        ] = await Promise.all([
          axios.get(`${endpoints.statistics.hospitalsCount}?hospitalId=${ID}`),
          axios.get(
            `${endpoints.statistics.submissionsCount}?hospitalId=${ID}`
          ),
          axios.get(
            `${endpoints.statistics.submissionsTodayCount}?hospitalId=${ID}`
          ),
          axios.get(`${endpoints.statistics.usersCount}?hospitalId=${ID}`),
          axios.get(
            `${endpoints.statistics.recentSubmissions}?hospitalId=${ID}`
          ),
          axios.get(`${endpoints.statistics.districts}?hospitalId=${ID}`),
          axios.get(`${endpoints.statistics.topPlatforms}?hospitalId=${ID}`),
          axios.get(`${endpoints.statistics.topProducts}?hospitalId=${ID}`),
          axios.get(`${endpoints.statistics.topClones}?hospitalId=${ID}`),
        ]);

        console.log(topClonesRes);

        setStats({
          hospitals: hospitalsRes?.data?.count || 0,
          submissions: submissionsRes?.data?.count || 0,
          submissionsToday: submissionsTodayRes?.data?.count || 0,
          users: usersRes?.data?.count || 0,
          recentSubmissions: Array.isArray(recentSubmissionsRes?.data)
            ? recentSubmissionsRes.data
            : Array.isArray(recentSubmissionsRes?.data?.data)
            ? recentSubmissionsRes.data.data
            : [],
          districts: Array.isArray(districtsRes?.data)
            ? districtsRes.data
            : Array.isArray(districtsRes?.data?.data)
            ? districtsRes.data.data
            : [],
          topPlatforms: Array.isArray(topPlatformsRes?.data?.data)
            ? topPlatformsRes.data.data
            : [],
          topProducts: Array.isArray(topProductsRes?.data?.data)
            ? topProductsRes.data.data
            : [],
          topClones: Array.isArray(topClonesRes?.data?.data)
            ? topClonesRes.data.data
            : [],
        });
      } catch (err) {
        console.error(err);

        setStats({
          hospitals: 0,
          submissions: 0,
          submissionsToday: 0,
          users: 0,
          recentSubmissions: [],
          districts: [],
          topPlatforms: [],
          topProducts: [],
          topClonesRes: [],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [ID]);

  useEffect(() => {
    if (ID) {
      axios
        .get(`${endpoints.hospital.readById}?id=${ID}`)
        .then((res) => {
          const data = res.data[0];

          if (data?.distrito) {
            const match = distritosPT.find(
              (d) => d.toLowerCase() === data.distrito.toLowerCase()
            );

            data.distrito = match || undefined;
          }

          setHospitalName(data?.nome || "");
        })
        .catch((err) => console.log(err));
    }
  }, [ID]);

  function goBack() {
    navigate("/app/hospital");
  }

  return (
    <div className="flex flex-col gap-6 p-2">
      <div className="flex justify-between items-center">
        <p className="text-xl text-black">
          <span className="font-bold">Instituição</span>
          {hospitalName && ` | ${hospitalName}`}
        </p>

        {user.role === "admin" && (
          <Button
            size="large"
            icon={<ArrowLeftOutlined />}
            onClick={goBack}
            className="!text-[#F5702B] !border !border-[#F5702B] !bg-transparent !rounded-[29px] !h-[40px] hover:!bg-[#F5702B] hover:!text-[#fff]"
          >
            Voltar
          </Button>
        )}
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12} xl={6}>
          <Card
            hoverable
            className="rounded-xl shadow-[0px_10px_20px_#00000005] h-[260px]"
            onClick={() => navigate(`${basePath}/user`)}
          >
            <div className="flex flex-col items-center justify-center text-center h-full">
              <div className="bg-[#E9F7F4] p-4 rounded-xl mb-6">
                <UserOutlined
                  style={{
                    fontSize: 32,
                    color: "#3C9787",
                  }}
                />
              </div>

              <h2 className="text-[22px] font-bold text-[#071B47] leading-none mb-3">
                Utilizadores
              </h2>

              <p className="text-gray-500 text-base text-[15px]">
                Gestão de utilizadores
              </p>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={6}>
          <Card
            hoverable
            className="rounded-xl shadow-[0px_10px_20px_#00000005] h-[260px]"
            onClick={() => navigate(`${basePath}/process`)}
          >
            <div className="flex flex-col items-center justify-center text-center h-full">
              <div className="bg-[#FFF2E5] p-4 rounded-xl mb-6">
                <FileOutlined
                  style={{
                    fontSize: 32,
                    color: "#F2994A",
                  }}
                />
              </div>

              <h2 className="text-[22px] font-bold text-[#071B47] leading-none mb-3">
                Processos
              </h2>

              <p className="text-gray-500 text-base text-[15px]">
                Gestão de processos
              </p>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={6}>
          <Card
            hoverable
            className="rounded-xl shadow-[0px_10px_20px_#00000005] h-[260px]"
            onClick={() => navigate(`${basePath}/profile`)}
          >
            <div className="flex flex-col items-center justify-center text-center h-full">
              <div className="bg-[#EEF0FF] p-4 rounded-xl mb-6">
                <DatabaseOutlined
                  style={{
                    fontSize: 32,
                    color: "#7D84FF",
                  }}
                />
              </div>

              <h2 className="text-[22px] font-bold text-[#071B47] leading-none mb-3">
                Dados Analíticos
              </h2>

              <p className="text-gray-500 text-base text-[15px]">
                Configurações de perfil
              </p>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={12} xl={6}>
          <Card
            hoverable
            className="rounded-xl shadow-[0px_10px_20px_#00000005] h-[260px]"
            onClick={() => navigate(`${basePath}/technical`)}
          >
            <div className="flex flex-col items-center justify-center text-center h-full">
              <div className="bg-[#F2F3F5] p-4 rounded-xl mb-6">
                <SettingOutlined
                  style={{
                    fontSize: 32,
                    color: "#808080",
                  }}
                />
              </div>

              <h2 className="text-[22px] font-bold text-[#071B47] leading-none mb-3">
                Templates
              </h2>

              <p className="text-gray-500 text-base text-[15px]">
                Configurações técnicas
              </p>
            </div>
          </Card>
        </Col>
      </Row>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-black">Dados estatísticos</h2>
        </div>

        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} md={12} xl={6}>
            <Card>
              <div className="text-center">
                <p className="text-gray-500 mb-4">
                  Nr. total de Rep. Hospitalares
                </p>
                <p className="text-4xl font-bold text-orange-500">
                  {stats.users}
                </p>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12} xl={6}>
            <Card>
              <div className="text-center">
                <p className="text-gray-500 mb-4">N.º total de submissões</p>
                <p className="text-4xl font-bold text-orange-500">
                  {stats.submissions}
                </p>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12} xl={6}>
            <Card>
              <div className="text-center">
                <p className="text-gray-500 mb-4">
                  N.º de submissões feitas hoje
                </p>
                <p className="text-4xl font-bold text-orange-500">
                  {stats.submissionsToday}
                </p>
              </div>
            </Card>
          </Col>

          <Col xs={24} md={12} xl={6}>
            <Card>
              <div className="text-center">
                <p className="text-gray-500 mb-4">Lorem</p>

                <p className="text-4xl font-bold text-orange-500">3</p>
              </div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} align="stretch">
          <Col xs={24} xl={6} className="h-full">
            <div className="h-full flex flex-col justify-between">
              <Card>
                <div className="mb-4">
                  <p className="text-bold text-left text-[16px] mb-1">
                    <b>Tipos de amostra</b>
                  </p>

                  {/* <p className="text-bold text-left text-[14px] mb-1">
                    Tipos de amostra mais submetidos.
                  </p> */}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {(stats.topProducts || []).slice(0, 2).map((item) => (
                    <div
                      key={item.produto}
                      className="flex flex-col justify-between pb-2"
                    >
                      <span className="text-[14px] font-regular">
                        {item.produto}
                      </span>

                      <span className="text-[34px] font-bold">
                        {item.total}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="!mt-4">
                <div className="mb-4">
                  <p className="text-bold text-left text-[16px] mb-1">
                    <b>Anticorpos</b>
                  </p>

                  {/* <p className="text-bold text-left text-[14px] mb-1">
                    Distribuição por anticorpo.
                  </p> */}
                </div>

                <div className="flex justify-center">
                  <PieChart
                    series={[
                      {
                        data: (stats.topClones || [])
                          .slice(0, 3)
                          .map((item, index) => ({
                            id: index,
                            value: Number(item.total),
                            label: item.anticorpo,
                          })),
                        paddingAngle: 5,
                        innerRadius: "60%",
                        outerRadius: "90%",
                        cx: 50,
                        cy: 50,
                      },
                    ]}
                    width={100}
                    height={100}
                  />
                </div>
              </Card>

              <Card className="!mt-4">
                <div className="mb-4">
                  <p className="text-bold text-left text-[16px] mb-1">
                    <b>Plataformas</b>
                  </p>

                  {/* <p className="text-bold text-left text-[14px] mb-1">
                    Plataformas mais utilizadas nas submissões.
                  </p> */}
                </div>

                <div className="grid grid-cols-3 gap-8">
                  {(stats.topPlatforms || []).slice(0, 3).map((item) => (
                    <div
                      key={item.plataforma}
                      className="flex flex-col justify-between pb-2"
                    >
                      <span className="text-[14px] font-regular">
                        {item.plataforma}
                      </span>

                      <span className="text-[34px] font-bold">
                        {item.total}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </Col>

          <Col xs={24} xl={18} className="h-full">
            <Card
              className="h-full"
              title="Submissões recentes"
              extra={
                <a
                  className="text-orange-500!"
                  href={`${basePath}/process`}
                >
                  Mostrar todos
                </a>
              }
            >
              <Table
                pagination={false}
                columns={[
                  {
                    title: "Rep. Hospitalar",
                    dataIndex: "representante",
                  },
                  {
                    title: "Nr. de Processo",
                    dataIndex: "numero",
                  },
                  {
                    title: "Tipo Doc.",
                    dataIndex: "status",
                  },
                  {
                    title: "Dia",
                    dataIndex: "dia",
                  },
                  {
                    title: "Hora",
                    dataIndex: "hora",
                  },
                ]}
                dataSource={stats.recentSubmissions.map((item) => ({
                  key: item.id,
                  representante: item.login_name,
                  numero: item.patient,
                  status: item.type,
                  dia: new Date(item.created_at).toLocaleDateString("pt-PT"),
                  hora: new Date(item.created_at).toLocaleTimeString("pt-PT", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                }))}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
