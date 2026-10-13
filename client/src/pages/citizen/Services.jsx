
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Home,
  Wallet,
  Award,
  ArrowRight,
} from "lucide-react";

const services = [
  {
    title: "Residence Certificate",
    description:
      "Apply for a certificate confirming your residential address.",
    icon: Home,
  },
  {
    title: "Income Certificate",
    description:
      "Submit a request for an income-related certificate.",
    icon: Wallet,
  },
  {
    title: "Character Certificate",
    description:
      "Request a character certificate through the DS office.",
    icon: Award,
  },
];

function Services() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        padding: "32px",
        fontFamily: '"Segoe UI", Arial, sans-serif',
      }}
    >
      <Link
        to="/citizen/dashboard"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: "#174ea6",
          textDecoration: "none",
          marginBottom: "24px",
          fontSize: "16px",
        }}
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>

      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            color: "#172b4d",
            marginBottom: "8px",
            fontSize: "38px",
            fontWeight: 750,
          }}
        >
          Available Services
        </h1>

        <p
          style={{
            color: "#64748b",
            marginBottom: "28px",
            fontSize: "17px",
          }}
        >
          Choose a service to start your application.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
          }}
        >
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.title}
                style={{
                  background: "#fff",
                  padding: "28px 24px",
                  borderRadius: "16px",
                  border: "1px solid #e7edf5",
                  boxShadow: "0 4px 14px rgba(23, 43, 77, 0.04)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                }}
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    background: "#eaf2ff",
                    color: "#174ea6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "18px",
                  }}
                >
                  <Icon size={24} />
                </div>

                <h2
                  style={{
                    color: "#172b4d",
                    fontSize: "21px",
                    fontWeight: 700,
                    margin: "4px 0 12px",
                  }}
                >
                  {service.title}
                </h2>

                <p
                  style={{
                    color: "#64748b",
                    lineHeight: 1.7,
                    fontSize: "16px",
                    minHeight: "54px",
                    margin: "0 0 20px",
                  }}
                >
                  {service.description}
                </p>

                <Link
                  to="/citizen/applications/new"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    marginTop: "auto",
                    color: "#174ea6",
                    fontWeight: 700,
                    fontSize: "16px",
                    textDecoration: "none",
                  }}
                >
                  Apply Now
                  <ArrowRight size={18} />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Services;

