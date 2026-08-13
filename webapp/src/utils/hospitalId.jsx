import { useContext } from "react";
import { useParams } from "react-router-dom";
import { Context } from "./context";

// Admin routes carry the hospital id in the URL (:ID / :hospitalId). The
// ID-less "/app/meu-hospital" routes used by adminHospital/repHospitalar
// don't, since those roles only ever have one hospital — fall back to it.
export function useHospitalId() {
  const { ID, hospitalId } = useParams();
  const { user } = useContext(Context);

  return ID || hospitalId || user?.hospital_id;
}

// Base path to build further hospital-scoped links from, without leaking
// the hospital id into non-admin URLs.
export function useHospitalBasePath() {
  const { user } = useContext(Context);
  const id = useHospitalId();

  return user?.role === "admin" ? `/app/hospital/${id}` : "/app/meu-hospital";
}
