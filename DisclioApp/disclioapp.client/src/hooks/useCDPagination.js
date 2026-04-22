import { useEffect, useState, useCallback } from "react";

export function useCDPagination(pageSize = 5) {
    const [cds, setCds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchCDs = useCallback(async (page = 1) => {
        setLoading(true);

        const query = `
            query GetPagedCDs($page: Int!, $size: Int!) {
                pagedCds(page: $page, size: $size) {
                    id
                    title
                    artist
                    category
                    manufacturer
                    year
                    condition
                    rating
                    description
                    songs
                    photos
                }
                totalCount
            }
        `;

        try {
            const res = await fetch("http://localhost:8080/graphql", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    query,
                    variables: {
                        page: page - 1, 
                        size: pageSize
                    }
                })
            });

            const json = await res.json();

            // GraphQL returns 200 OK even if there are query errors, so we check for them in this way
            if (json.errors) {
                console.error("GraphQL Errors:", json.errors);
                throw new Error("Failed to fetch CDs via GraphQL");
            }

            const fetchedCds = json.data.pagedCds;
            const total = json.data.totalCount;

            setCds(fetchedCds);
            setTotalCount(total);
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