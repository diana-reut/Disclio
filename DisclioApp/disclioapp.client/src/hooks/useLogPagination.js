import { useCallback, useEffect, useRef, useState } from "react";
import { GRAPHQL_ENDPOINT } from "../api/client";

export function useLogPagination(pageSize = 10) {
    const [logs, setLogs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const prefetchCache = useRef(null);

    const fetchPageFromServer = useCallback(async (page) => {
        const query = `
            query GetPagedSystemLogs($page: Int!, $size: Int!) {
                pagedSystemLogs(page: $page, size: $size) {
                    id
                    userId
                    groupRole
                    actionInformation
                    timestamp
                }
                totalLogCount
            }
        `;

        const response = await fetch(GRAPHQL_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                query,
                variables: {
                    page: page - 1,
                    size: pageSize
                }
            })
        });

        const result = await response.json();

        if (result.errors) {
            throw new Error(result.errors[0].message);
        }

        return {
            items: result.data?.pagedSystemLogs ?? [],
            total: result.data?.totalLogCount ?? 0
        };
    }, [pageSize]);

    const loadInitialData = useCallback(async () => {
        setLoading(true);
        setError(null);
        prefetchCache.current = null;

        try {
            const initialData = await fetchPageFromServer(1);
            setLogs(initialData.items);
            setTotalCount(initialData.total);
            setCurrentPage(1);

            const calculatedTotalPages = Math.ceil(initialData.total / pageSize);
            if (calculatedTotalPages > 1) {
                prefetchCache.current = await fetchPageFromServer(2);
            }
        } catch (err) {
            setError(err.message);
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

            setLogs((prev) => {
                const existingIds = new Set(prev.map((log) => log.id));
                const filtered = newData.items.filter((log) => !existingIds.has(log.id));
                return [...prev, ...filtered];
            });

            setTotalCount(newData.total);
            setCurrentPage(nextPageNum);

            if (nextPageNum < totalPages) {
                prefetchCache.current = await fetchPageFromServer(nextPageNum + 1);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [currentPage, fetchPageFromServer, loading, totalPages]);

    return {
        logs,
        loading,
        error,
        hasMore: currentPage < totalPages,
        loadMore,
        refresh: loadInitialData
    };
}
