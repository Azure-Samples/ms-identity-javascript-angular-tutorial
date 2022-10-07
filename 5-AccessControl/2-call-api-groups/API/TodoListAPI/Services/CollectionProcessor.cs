using Microsoft.Extensions.Caching.Memory;
using Microsoft.Graph;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TodoListAPI.Utils
{
    /// <summary>
    /// Processes a collection page with next-links from Graph
    /// </summary>
    /// <typeparam name="T">The type of Graph entity</typeparam>
    public class CollectionProcessor<T> : ICollectionProcessor<T>
    {
        private GraphServiceClient _graphServiceClient;

        public CollectionProcessor(GraphServiceClient graphServiceClient)
        {
            _graphServiceClient = graphServiceClient ?? throw new ArgumentNullException(nameof(graphServiceClient));
        }

        /// <summary>
        /// Processes the MS Graph collection page.
        /// </summary>
        /// <param name="graphServiceClient">The graph service client.</param>
        /// <param name="collectionPage">The collection page.</param>
        /// <returns></returns>
        public async Task<List<T>> ProcessGraphCollectionPageAsync(ICollectionPage<T> collectionPage, int maxRows = -1)
        {
            List<T> allItems = new List<T>();
            bool breaktime = false;

            var pageIterator = PageIterator<T>.CreatePageIterator(_graphServiceClient, collectionPage, (item) =>
            {
                allItems.Add(item);

                if (maxRows != -1 && allItems.Count >= maxRows)
                {
                    breaktime = true;
                    return false;
                }

                return true;
            });

            // Start iteration
            await pageIterator.IterateAsync();

            while (pageIterator.State != PagingState.Complete)
            {
                if (breaktime)
                {
                    break;
                }

                // Keep iterating till complete.
                await pageIterator.ResumeAsync();
            }

            return allItems;
        }
    }
}