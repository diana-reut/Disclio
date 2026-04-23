import React, { useState } from "react";
import { GridView } from "../mainViews/GridView";
import { StatisticsView } from "../statistics/StatisticsView";
import "./DashboardView.css";
import { useCDSocket } from "../../hooks/useCDSocket";

export function DashboardView({
    cds,
    setCds,
    deleteCD,
    loadMore,
    hasMore,
    loading,
    fetchRatingStats
}) {

    // WebSocket live updates
    useCDSocket((newCD) => {
        console.log("WS RECEIVED:", newCD);

        setCds(prev => {
            // prevent duplicates (important)
            const exists = prev.some(cd => cd.id === newCD.id);
            if (exists) return prev;

            return [newCD, ...prev];
        });
    });

    return (
        <div className="dashboard-outer-wrapper">
            <div className="dashboard-container">

                <header className="dashboard-header">
                    <button className="small-btn active-stop">
                        Live Generator Running (WebSocket)
                    </button>
                </header>

                <div className="dashboard-grid">

                    <aside className="stats-column">
                        <div className="dashboard-section stats-card sticky-stats">
                            <StatisticsView fetchRatingStats={fetchRatingStats} />
                        </div>
                    </aside>

                    <main className="gallery-column">
                        <section className="dashboard-section gallery-card">

                            <GridView
                                cds={cds}
                                deleteCD={deleteCD}
                                loadMore={loadMore}
                                hasMore={hasMore}
                                loading={loading}
                            />

                        </section>
                    </main>

                </div>
            </div>
        </div>
    );
}