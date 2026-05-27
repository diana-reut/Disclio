import { useState, useEffect, useRef, useCallback } from "react";
import { getGraphQLErrorMessage, graphqlRequest } from "../api/client";

const CDS_CACHE_KEY = "cached_cds";
const CDS_TOTAL_KEY = "cached_cds_total";

export function useCDPagination(pageSize = 5) {
    const [cds, setCds] = useState(() => {
        const cached = localStorage.getItem(CDS_CACHE_KEY);
        return cached ? JSON.parse(cached) : [];
    });

    const [currentPage, setCurrentPage] = useState(1);

    const [totalCount, setTotalCount] = useState(() => {
        const cachedTotal = localStorage.getItem(CDS_TOTAL_KEY);
        return cachedTotal ? Number(cachedTotal) : 0;
    });

    const [loading, setLoading] = useState(false);
    const prefetchCache = useRef(null);

    const saveCache = (items, total) => {
        localStorage.setItem(CDS_CACHE_KEY, JSON.stringify(items));
        localStorage.setItem(CDS_TOTAL_KEY, String(total));
    };

    const fetchPageFromServer = useCallback(async (page) => {
        const query = `
            query GetPagedCDs($page: Int!, $size: Int!) {
                pagedCds(page: $page, size: $size) {
                    id
                    title
                    artist
                    cover
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

        const json = await graphqlRequest({
            query,
            variables: {
                page: page - 1,
                size: pageSize
            }
        });

        if (json.errors) {
            console.error("GraphQL Errors:", json.errors);
            throw new Error(getGraphQLErrorMessage(json) || "Failed to fetch CDs via GraphQL");
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

            saveCache(initialData.items, initialData.total);

            const calculatedTotalPages = Math.ceil(initialData.total / pageSize);

            if (calculatedTotalPages > 1) {
                prefetchCache.current = await fetchPageFromServer(2);
            }
        } catch (err) {
            console.error("Failed to load initial CDs:", err);

            const cached = localStorage.getItem(CDS_CACHE_KEY);
            const cachedTotal = localStorage.getItem(CDS_TOTAL_KEY);

            if (cached) {
                const cachedItems = JSON.parse(cached);
                setCds(cachedItems);
                setTotalCount(cachedTotal ? Number(cachedTotal) : cachedItems.length);
                setCurrentPage(Math.ceil(cachedItems.length / pageSize) || 1);
                console.log("Loaded CDs from local cache.");
            }
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
                const updated = [...prev, ...filtered];

                saveCache(updated, newData.total);

                return updated;
            });

            setTotalCount(newData.total);
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

    const addCdOffline = (cdData) => {
        const tempCd = {
            ...cdData,
            id: Date.now() * -1, // temporary negative ID
            songs: cdData.songs || []
        };

        setCds(prev => {
            const updated = [tempCd, ...prev];
            saveCache(updated, totalCount + 1);
            return updated;
        });

        setTotalCount(prev => prev + 1);
    };

    const updateCdOffline = (id, cdData) => {
        const numericId = parseInt(id, 10);

        setCds(prev => {
            const updated = prev.map(cd =>
                cd.id === numericId
                    ? { ...cd, ...cdData, id: numericId }
                    : cd
            );

            saveCache(updated, totalCount);
            return updated;
        });
    };

    const deleteCdOffline = (id) => {
        const numericId = parseInt(id, 10);

        setCds(prev => {
            const updated = prev.filter(cd => cd.id !== numericId);
            saveCache(updated, totalCount - 1);
            return updated;
        });

        setTotalCount(prev => Math.max(0, prev - 1));
    };

    const getCachedCDById = (id) => {
        const cached = localStorage.getItem("cached_cds");
        if (!cached) return null;

        const cds = JSON.parse(cached);
        return cds.find(cd => cd.id === parseInt(id, 10)) || null;
    };

    return {
        cds,
        loading,
        totalCount,
        hasMore: currentPage < totalPages,
        loadMore,
        refresh,
        addCdOffline,
        updateCdOffline,
        deleteCdOffline,
        getCachedCDById
    };
}
