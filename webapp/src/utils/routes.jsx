import { Navigate, Route, Routes, useParams, useLocation } from "react-router-dom";
import { ConfigProvider } from "antd";
import { Context } from "./context";
import { useContext } from "react";
import Loading from "../layout/loading";
import Login from "../pages/auth/login";
import Main from "../pages/main/main";
import MainLayout from "../layout/index";

import SubmissionDetails from "../pages/main/submission/details";
import SubmissionCreate from "../pages/main/submission/create";

import Hospitals from "../pages/main/hospital/main";

import RepHospital from "../pages/main/repHospital/main";
import RepHospitalForm from "../pages/main/repHospital/form";
import UserProfileForm from "../pages/auth/profile";
import AdminDashboard from "../pages/main/dashboard/admin";
import ForgotPassword from "../pages/auth/password";

import Process from "../pages/main/process/main";
import AdminForm from "../pages/main/admin/form";
import Admin from "../pages/main/admin/main";
import DataManagement from "../pages/main/admin/dataManagement";
import Submission from "../pages/main/submission/main";
import HospitalParamsList from "../pages/main/hospital/params";
import TechnicalForm from "../pages/main/hospital/technical/form";
import ProfileForm from "../pages/main/hospital/profile";
import HospitalView from "../pages/main/hospital/view";
import TechnicalList from "../pages/main/hospital/technical/index";
import LogsPage from "../pages/main/logs/main";
import PublicRegistry from "../pages/public/registry";

function landingPathFor(user) {
  return user?.role === "admin" ? "/app" : "/app/meu-hospital";
}

// Bloqueia o acesso a quem não tem um dos roles permitidos.
function RequireRole({ roles, children }) {
  const { user } = useContext(Context);

  if (!roles.includes(user.role)) {
    return <Navigate to={landingPathFor(user)} replace />;
  }

  return children;
}

// Bloqueia adminHospital/repHospitalar de acederem a dados de outro hospital.
function RequireOwnHospital({ children }) {
  const { user } = useContext(Context);
  const params = useParams();
  const location = useLocation();
  const targetHospitalId = params.ID || params.hospitalId;

  if (user.role !== "admin") {
    if (String(user.hospital_id) !== String(targetHospitalId)) {
      return <Navigate to={landingPathFor(user)} replace />;
    }

    // Roles com um único hospital nunca veem o id na URL — qualquer link
    // direto/antigo com o id é redirecionado para o equivalente sem id.
    const rest = location.pathname.slice(
      `/app/hospital/${targetHospitalId}`.length
    );

    return (
      <Navigate to={`/app/meu-hospital${rest}${location.search}`} replace />
    );
  }

  return children;
}

export default function AppRoutes() {
  const { isLoggedIn, isLoading } = useContext(Context);

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#ff6900",
          fontFamily: "Poppins",
        },
      }}
    >
      {isLoading ? (
        <Loading />
      ) : (
        <Routes>
          {isLoggedIn ? (
            <>
              <Route element={<MainLayout />}>
                <Route
                  exact
                  path="/"
                  element={<Navigate to={`/app/`} replace />}
                />
                <Route
                  exact
                  path="/login"
                  element={<Navigate to={`/app/`} replace />}
                />
                <Route
                  exact
                  path="/app/"
                  element={
                    <RequireRole roles={["admin"]}>
                      <AdminDashboard />
                    </RequireRole>
                  }
                />
                <Route
                  exact
                  path="/app/hospital/:hospitalId/process"
                  element={
                    <RequireOwnHospital>
                      <Process />
                    </RequireOwnHospital>
                  }
                />
                <Route
                  exact
                  path="/app/submission"
                  element={
                    <RequireRole roles={["admin"]}>
                      <Submission />
                    </RequireRole>
                  }
                />
                <Route
                  exact
                  path="/app/hospital/:hospitalId/submission/create"
                  element={
                    <RequireOwnHospital>
                      <SubmissionCreate />
                    </RequireOwnHospital>
                  }
                />
                <Route
                  exact
                  path="/app/params"
                  element={<HospitalParamsList />}
                />
                <Route
                  exact
                  path="/app/submission/:ID"
                  element={<SubmissionDetails />}
                />
                <Route
                  exact
                  path="/app/hospital"
                  element={
                    <RequireRole roles={["admin"]}>
                      <Hospitals />
                    </RequireRole>
                  }
                />
                <Route
                  exact
                  path="/app/hospital/create"
                  element={
                    <RequireRole roles={["admin"]}>
                      <ProfileForm />
                    </RequireRole>
                  }
                />
                <Route
                  exact
                  path="/app/hospital/:ID"
                  element={
                    <RequireOwnHospital>
                      <HospitalView />
                    </RequireOwnHospital>
                  }
                />
                <Route
                  exact
                  path="/app/hospital/:ID/technical"
                  element={
                    <RequireOwnHospital>
                      <TechnicalList />
                    </RequireOwnHospital>
                  }
                />

                <Route
                  exact
                  path="/app/hospital/:ID/technical/create"
                  element={
                    <RequireOwnHospital>
                      <TechnicalForm />
                    </RequireOwnHospital>
                  }
                />

                <Route
                  exact
                  path="/app/hospital/:ID/technical/:technicalId"
                  element={
                    <RequireOwnHospital>
                      <TechnicalForm />
                    </RequireOwnHospital>
                  }
                />
                <Route
                  exact
                  path="/app/hospital/:ID/profile"
                  element={
                    <RequireOwnHospital>
                      <ProfileForm />
                    </RequireOwnHospital>
                  }
                />
                <Route
                  path="/app/hospital/:hospitalId/user"
                  element={
                    <RequireRole roles={["admin", "adminHospital", "repHospitalar"]}>
                      <RequireOwnHospital>
                        <RepHospital />
                      </RequireOwnHospital>
                    </RequireRole>
                  }
                />
                <Route
                  path="/app/hospital/:hospitalId/user/create"
                  element={
                    <RequireRole roles={["admin", "adminHospital"]}>
                      <RequireOwnHospital>
                        <RepHospitalForm />
                      </RequireOwnHospital>
                    </RequireRole>
                  }
                />
                <Route
                  path="/app/hospital/:hospitalId/user/:respId"
                  element={
                    <RequireRole roles={["admin", "adminHospital"]}>
                      <RequireOwnHospital>
                        <RepHospitalForm />
                      </RequireOwnHospital>
                    </RequireRole>
                  }
                />
                <Route
                  exact
                  path="/app/meu-hospital"
                  element={
                    <RequireRole roles={["adminHospital", "repHospitalar"]}>
                      <HospitalView />
                    </RequireRole>
                  }
                />
                <Route
                  exact
                  path="/app/meu-hospital/process"
                  element={
                    <RequireRole roles={["adminHospital", "repHospitalar"]}>
                      <Process />
                    </RequireRole>
                  }
                />
                <Route
                  exact
                  path="/app/meu-hospital/submission/create"
                  element={
                    <RequireRole roles={["adminHospital", "repHospitalar"]}>
                      <SubmissionCreate />
                    </RequireRole>
                  }
                />
                <Route
                  exact
                  path="/app/meu-hospital/technical"
                  element={
                    <RequireRole roles={["adminHospital", "repHospitalar"]}>
                      <TechnicalList />
                    </RequireRole>
                  }
                />
                <Route
                  exact
                  path="/app/meu-hospital/technical/create"
                  element={
                    <RequireRole roles={["adminHospital", "repHospitalar"]}>
                      <TechnicalForm />
                    </RequireRole>
                  }
                />
                <Route
                  exact
                  path="/app/meu-hospital/technical/:technicalId"
                  element={
                    <RequireRole roles={["adminHospital", "repHospitalar"]}>
                      <TechnicalForm />
                    </RequireRole>
                  }
                />
                <Route
                  exact
                  path="/app/meu-hospital/profile"
                  element={
                    <RequireRole roles={["adminHospital", "repHospitalar"]}>
                      <ProfileForm />
                    </RequireRole>
                  }
                />
                <Route
                  path="/app/meu-hospital/user"
                  element={
                    <RequireRole roles={["adminHospital", "repHospitalar"]}>
                      <RepHospital />
                    </RequireRole>
                  }
                />
                <Route
                  path="/app/meu-hospital/user/create"
                  element={
                    <RequireRole roles={["adminHospital"]}>
                      <RepHospitalForm />
                    </RequireRole>
                  }
                />
                <Route
                  path="/app/meu-hospital/user/:respId"
                  element={
                    <RequireRole roles={["adminHospital"]}>
                      <RepHospitalForm />
                    </RequireRole>
                  }
                />
                <Route path="/app/profile" element={<UserProfileForm />} />
                <Route
                  path="/app/logs"
                  element={
                    <RequireRole roles={["admin", "adminHospital"]}>
                      <LogsPage />
                    </RequireRole>
                  }
                />
                <Route
                  path="/app/admin"
                  element={
                    <RequireRole roles={["admin"]}>
                      <Admin />
                    </RequireRole>
                  }
                />
                <Route
                  path="/app/admin/create"
                  element={
                    <RequireRole roles={["admin"]}>
                      <AdminForm />
                    </RequireRole>
                  }
                />
                <Route
                  path="/app/data-management"
                  element={
                    <RequireRole roles={["admin", "adminHospital", "repHospitalar"]}>
                      <DataManagement />
                    </RequireRole>
                  }
                />
                <Route
                  path="/app/admin/:ID"
                  element={
                    <RequireRole roles={["admin"]}>
                      <AdminForm />
                    </RequireRole>
                  }
                />
              </Route>
              <Route
                exact
                path="/estatisticas"
                element={<Navigate to="/registos#estatisticas" replace />}
              />
              <Route
                exact
                path="/registos"
                element={<PublicRegistry />}
              />
            </>
          ) : (
            <Route>
              <Route exact path="/login" element={<Login />} />
              <Route
                exact
                path="/estatisticas"
                element={<Navigate to="/registos#estatisticas" replace />}
              />
              <Route
                exact
                path="/registos"
                element={<PublicRegistry />}
              />
              <Route exact path="/*" element={<Navigate to="/login" />} />
              <Route
                exact
                path="/forgotPassword"
                element={<ForgotPassword />}
              />
              <Route path="/resetPassword" element={<ForgotPassword />} />
            </Route>
          )}
        </Routes>
      )}
    </ConfigProvider>
  );
}
