import { useState, useEffect, useRef, useCallback } from "react";

export function useCDPagination(pageSize = 5) {
    const [cds, setCds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const prefetchCache = useRef(null);

    const fetchPageFromServer = useCallback(async (page) => {
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
            photos
            songs {        
                id
                title
                duration
                trackNumber
            }
        }
        totalCount
    }
`;

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

        if (json.errors) {
            console.error("GraphQL Errors:", json.errors);
            throw new Error("Failed to fetch CDs via GraphQL");
        }

        return {
            items: json.data.pagedCds,
            total: json.data.totalCount
        };
    }, [pageSize]);

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        try {
            const initialData = await fetchPageFromServer(1);
            setCds(initialData.items);
            setTotalCount(initialData.total);
            setCurrentPage(1);

            const calculatedTotalPages = Math.ceil(initialData.total / pageSize);

            if (calculatedTotalPages > 1) {
                prefetchCache.current = await fetchPageFromServer(2);
            }
        } catch (err) {
            console.error("Failed to load initial CDs:", err);
        } finally {
            setLoading(false);
        }
    }, [fetchPageFromServer, pageSize]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const loadMore = useCallback(async () => {
        if (loading || currentPage >= totalPages) return;

        setLoading(true);
        const nextPageNum = currentPage + 1;

        try {
            let newData;
            if (prefetchCache.current) {
                newData = prefetchCache.current;
                prefetchCache.current = null;
            } else {
                newData = await fetchPageFromServer(nextPageNum);
            }

            setCds(prev => {
                const existingIds = new Set(prev.map(cd => cd.id));
                const filtered = newData.items.filter(cd => !existingIds.has(cd.id));
                return [...prev, ...filtered];
            });
            setCurrentPage(nextPageNum);

            if (nextPageNum < totalPages) {
                prefetchCache.current = await fetchPageFromServer(nextPageNum + 1);
            }
        } catch (err) {
            console.error("Failed to load more CDs:", err);
        } finally {
            setLoading(false);
        }
    }, [currentPage, totalPages, loading, fetchPageFromServer]);

    const refresh = () => {
        prefetchCache.current = null;
        loadInitialData();
    };

    return {
        cds,
        loading,
        totalCount,
        hasMore: currentPage < totalPages,
        loadMore,
        refresh,
    };
}