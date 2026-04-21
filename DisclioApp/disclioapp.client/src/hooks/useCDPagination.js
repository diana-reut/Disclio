import { useEffect, useState, useCallback } from "react";

export function useCDPagination(pageSize = 5) {
    const [cds, setCds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchCDs = useCallback(async (page = 1) => {
        setLoading(true);

        try {
            const res = await fetch(
                `http://localhost:8080/api/cds/paged?page=${page - 1}&size=${pageSize}`
            );

            const data = await res.json();
            const total = res.headers.get("Total-Count");

            setCds(data);
            setTotalCount(Number(total));
            setCurrentPage(page);
        } catch (err) {
            console.error("Failed to fetch CDs:", err);
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    useEffect(() => {
        fetchCDs(1);
    }, [fetchCDs]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        fetchCDs(page);
    };

    const nextPage = () => goToPage(currentPage + 1);
    const prevPage = () => goToPage(currentPage - 1);

    return {
        cds,
        currentPage,
        totalPages,
        totalCount,
        loading,
        goToPage,
        nextPage,
        prevPage,
        refresh: () => fetchCDs(currentPage),
    };
}