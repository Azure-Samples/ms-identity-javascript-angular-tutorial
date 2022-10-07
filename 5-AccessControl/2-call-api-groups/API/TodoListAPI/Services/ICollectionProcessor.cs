using Microsoft.Graph;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace TodoListAPI.Utils
{
    public interface ICollectionProcessor<T>
    {
        Task<List<T>> ProcessGraphCollectionPageAsync(ICollectionPage<T> collectionPage, int maxRows = -1);
    }
}