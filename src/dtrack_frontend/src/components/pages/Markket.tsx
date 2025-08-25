import { DownloadIcon } from "lucide-react";
import React from "react";

const reports = [
  { title: "Q2 2024 Market Analysis", date: "June 30, 2024", size: "2.5MB" },
  {
    title: "Annual Financial Summary 2023",
    date: "April 15, 2024",
    size: "5.1MB",
  },
  {
    title: "Emerging Tech Trends Report",
    date: "March 1, 2024",
    size: "3.8MB",
  },
  {
    title: "Consumer Behavior Insights Q1 2024",
    date: "February 20, 2024",
    size: "4.2MB",
  },
];

const MarketReports: React.FC = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Market Reports</h1>
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="border-t">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left text-muted-foreground">
                <th className="font-medium p-4">Report Title</th>
                <th className="font-medium p-4 hidden sm:table-cell">Date</th>
                <th className="font-medium p-4 hidden md:table-cell">
                  File Size
                </th>
                <th className="font-medium p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.title} className="border-b last:border-0">
                  <td className="p-4 font-medium">{report.title}</td>
                  <td className="p-4 text-muted-foreground hidden sm:table-cell">
                    {report.date}
                  </td>
                  <td className="p-4 text-muted-foreground hidden md:table-cell">
                    {report.size}
                  </td>
                  <td className="p-4 text-right">
                    <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10">
                      <DownloadIcon className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketReports;
