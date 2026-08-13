import React, { useEffect, useState, useRef } from "react";
import { Card, Col, Row, Spin, Table, Tooltip, Avatar } from "antd";
import axios from "axios";
import {
  HomeOutlined,
  FileOutlined,
  ClockCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import endpoints from "../../../utils/endpoints";
import repHospitalaresImg from "../../../assets/statistics/Rep-Hospitalares.svg";
import amostrasImg from "../../../assets/statistics/Amostras.svg";
import portugalImg from "../../../assets/statistics/Portugal.svg";
import hojeImg from "../../../assets/statistics/Hoje.svg";
import submissoesImg from "../../../assets/statistics/Submissoes.svg";
import { Link } from "react-router";
import { PieChart } from "@mui/x-charts/PieChart";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    hospitals: 0,
    submissions: 0,
    submissionsToday: 0,
    users: 0,
    recentSubmissions: [],
    districts: [],
  });

  // Mesmo agrupamento de distritos em macro-regiões usado nas estatísticas
  // públicas (server/routes/publicStats.js) — aqui só para agregar os counts
  // por distrito que a API já devolve, sem precisar de um endpoint novo.
  const REGIAO_POR_DISTRITO = {
    Braga: "Norte",
    Bragança: "Norte",
    Porto: "Norte",
    "Viana do Castelo": "Norte",
    "Vila Real": "Norte",

    Aveiro: "Centro",
    "Castelo Branco": "Centro",
    Coimbra: "Centro",
    Guarda: "Centro",
    Leiria: "Centro",
    Viseu: "Centro",

    Beja: "Sul",
    Évora: "Sul",
    Faro: "Sul",
    Lisboa: "Sul",
    Portalegre: "Sul",
    Santarém: "Sul",
    Setúbal: "Sul",
  };

  const regionPositions = {
    Norte: { top: "12%", left: "65%" },
    Centro: { top: "35%", left: "62%" },
    Sul: { top: "70%", left: "57%" },
  };

  const chartRef = useRef(null);

  const columns = [
    {
      title: "Rep. Hospitalar",
      dataIndex: "login_name",
      key: "login_name",
      render: (name, record) => (
        <div className="flex items-center gap-2">
          {record.login_avatar ? (
            <Avatar src={`http://localhost:4000${record.login_avatar}`} />
          ) : (
            <Avatar>
              {name
                ?.split(" ")
                .map((w) => w[0])
                .join("")
                .toUpperCase()}
            </Avatar>
          )}
          <span>{name}</span>
        </div>
      ),
    },
    {
      title: "Hospital",
      dataIndex: "hospital_name",
      key: "hospital_name",
    },
    {
      title: "Nº do Processo",
      dataIndex: "patient",
      key: "patient",
    },
    {
      title: "Data",
      dataIndex: "created_at",
      key: "created_at",
      render: (date) => (date ? new Date(date).toLocaleString() : "-"),
    },
  ];

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
          axios.get(endpoints.statistics.hospitalsCount),
          axios.get(endpoints.statistics.submissionsCount),
          axios.get(endpoints.statistics.submissionsTodayCount),
          axios.get(endpoints.statistics.usersCount),
          axios.get(endpoints.statistics.recentSubmissions),
          axios.get(endpoints.statistics.districts),
          axios.get(endpoints.statistics.topPlatforms),
          axios.get(endpoints.statistics.topProducts),
          axios.get(endpoints.statistics.topClones),
        ]);

        console.log(topClonesRes.data.data);

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
  }, []);

  if (loading) return <Spin tip="Carregando..." size="large" />;

  return (
    <div className="flex flex-col gap-6 p-2">
      <Row gutter={[16, 16]} className="mb-6 statistics">
        <Col span={6}>
          <Card bodyStyle={{ height: "100%" }}>
            <div className="flex flex-col justify-between items-between h-full">
              <div>
                <div className="text-center flex justify-center mb-4">
                  <img
                    src={repHospitalaresImg}
                    alt="Usuários"
                    className="max-w-full h-auto text-center"
                  />
                </div>

                <p className="text-bold text-center text-[16px]">
                  Instituições
                  <br />
                </p>
              </div>

              <p className="text-900 text-center text-[25px]">
                <b>{stats.hospitals}</b>
              </p>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="flex justify-center align-middle p-6">
            <div className="text-center flex justify-center mb-4">
              <img
                src={repHospitalaresImg}
                alt="Rep Hospitalares"
                className="max-w-full h-auto text-center"
              />
            </div>
            <p className="text-bold text-center text-[16px] mb-3">
              Nº. total de <br />
              rep. hospitalares
            </p>
            <p className="text-900 text-center text-[25px]">
              <b>{stats.hospitals}</b>
            </p>
          </Card>
        </Col>

        <Col span={6}>
          <Card className="flex justify-center align-middle p-6">
            <div className="text-center flex justify-center mb-4">
              <img
                src={submissoesImg}
                alt="Submissões"
                className="max-w-full h-auto text-center"
              />
            </div>
            <p className="text-bold text-center text-[16px] mb-3">
              N.º total de <br />
              submissões
            </p>
            <p className="text-900 text-center text-[25px]">
              <b>{stats.submissions}</b>
            </p>
          </Card>
        </Col>

        <Col span={6}>
          <Card className="flex justify-center align-middle p-6">
            <div className="text-center flex justify-center mb-4">
              <img
                src={hojeImg}
                alt="Hoje"
                className="max-w-full h-auto text-center"
              />
            </div>
            <p className="text-bold text-center text-[16px] mb-3">
              N.º de submissões <br />
              feitas hoje
            </p>
            <p className="text-900 text-center text-[25px]">
              <b>{stats.submissionsToday}</b>
            </p>
          </Card>
        </Col>

        <Col span={8}>
          <Card className="mb-6 flex-col justify-between">
            <div className="mb-4">
              <p className="text-bold text-left text-[16px] mb-1">
                <b>Tipos de amostra</b>
              </p>

              <p className="text-bold text-left text-[14px] mb-1">
                Tipos de amostra mais submetidos.
              </p>
              <br />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {(Array.isArray(stats.topProducts)
                ? stats.topProducts.slice(0, 2)
                : []
              ).map((item, index) => (
                <div
                  key={item.produto}
                  className="flex flex-col justify-between pb-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[14px] font-regular">
                      {item.produto}
                    </span>
                  </div>

                  <span className="text-[34px] font-bold">{item.total}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card className="mb-6">
            <div className="mb-4">
              <p className="text-bold text-left text-[16px] mb-1">
                <b>Anticorpos</b>
              </p>

              <p className="text-bold text-left text-[14px] mb-1">
                Distribuição por anticorpo.
              </p>
            </div>

            <div className="flex justify-center">
              <PieChart
                series={[
                  {
                    data: stats.topClones.slice(0, 3).map((item, index) => ({
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
        </Col>
        <Col span={8}>
          <Card className="mb-6">
            <div className="mb-4">
              <p className="text-bold text-left text-[16px] mb-1">
                <b>Plataformas</b>
              </p>

              <p className="text-bold text-left text-[14px] mb-1">
                Plataformas mais utilizadas nas submissões.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-10">
              {" "}
              {(Array.isArray(stats.topPlatforms)
                ? stats.topPlatforms.slice(0, 3)
                : []
              ).map((item, index) => (
                <div key={item.plataforma} className="flex flex-col pb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[15px] font-regular">
                      {item.plataforma}
                    </span>
                  </div>

                  <span className="text-[34px] font-bold">{item.total}</span>
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col span={16}>
          <Card className="mb-6">
            <Row justify={"space-between"}>
              <div className="mb-4">
                <p className="text-bold text-left text-[16px] mb-1">
                  <b>Submissões recentes</b>
                </p>
                <p className="text-bold text-left text-[14px] mb-1">
                  Estão aqui listadas as últimas submissões feitas na
                  plataforma.
                </p>
              </div>

              <Link to={"/app/submission"} className="text-black">
                <u className="text-black">Mostrar todos</u>
              </Link>
            </Row>

            <Table
              dataSource={
                Array.isArray(stats.recentSubmissions)
                  ? stats.recentSubmissions.slice(0, 5)
                  : []
              }
              columns={columns}
              rowKey="id"
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>
        </Col>

        <Col span={8}>
          <Card className="mb-6" style={{ position: "relative" }}>
            <div className="mb-4">
              <p className="text-bold text-left text-[16px] mb-1">
                <b>Submissões por região</b>
              </p>
              <p className="text-bold text-left text-[14px] mb-1">
                Veja aqui a distribuição por Norte, Centro e Sul.
              </p>
            </div>

            <div
              style={{
                position: "relative",
                width: "100%",
                paddingTop: "120%",
                backgroundImage: `url(${portugalImg})`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center",
              }}
            >
              {(() => {
                const districts = Array.isArray(stats.districts)
                  ? stats.districts
                  : [];

                const regionCounts = { Norte: 0, Centro: 0, Sul: 0 };

                districts.forEach((d) => {
                  const regiao = REGIAO_POR_DISTRITO[d.distrito];

                  if (!regiao) return;

                  regionCounts[regiao] += Number(d.count) || 0;
                });

                const regions = Object.entries(regionCounts).map(
                  ([regiao, count]) => ({ regiao, count })
                );

                const counts = regions.map((r) => r.count);
                const maxCount = counts.length ? Math.max(...counts) : 0;
                const minCount = counts.length ? Math.min(...counts) : 0;

                return regions.map((item) => {
                  const pos = regionPositions[item.regiao];

                  if (!pos) return null;

                  const count = item.count;

                  // proporção da região dentro do intervalo min..max, para
                  // o círculo e o padding crescerem juntos com o nº de
                  // submissões (região com mais submissões = bolha maior).
                  const ratio =
                    maxCount > minCount
                      ? (count - minCount) / (maxCount - minCount)
                      : 1;

                  const size = 24 + ratio * 40; // 24px..64px
                  const padding = 8 + ratio * 16; // 8px..24px

                  return (
                    <Tooltip
                      key={item.regiao}
                      title={`${item.regiao}: ${item.count} submissões`}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: pos.top,
                          padding: `${padding}px`,
                          left: pos.left,
                          width: size,
                          height: size,
                          borderRadius: "50%",
                          backgroundColor: "rgba(38,153,251,0.7)",
                          transform: "translate(-50%, -50%)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: "bold",
                        }}
                      >
                        {item.count}
                      </div>
                    </Tooltip>
                  );
                });
              })()}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;
