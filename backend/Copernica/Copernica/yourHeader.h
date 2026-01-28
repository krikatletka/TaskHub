#pragma once
#include <string>
#include <vector>

class YourSet
{
private:
    std::vector<std::string> _data;

    std::size_t lowerBound(const std::string& value) const
    {
        std::size_t left = 0;
        std::size_t right = _data.size();

        while (left < right)
        {
            std::size_t mid = left + (right - left) / 2;
            if (_data[mid] < value)
                left = mid + 1;
            else
                right = mid;
        }
        return left;
    }

public:

    bool add(const std::string& value){
        std::size_t pos = lowerBound(value);
        if (pos < _data.size() && _data[pos] == value) {
            return false;
        }
        _data.insert(_data.begin() + pos, value);
        return true;
    }

    bool add(std::string&& value) {
        std::size_t pos = lowerBound(value);
        if (pos < _data.size() && _data[pos] == value) {
            return false;

        }
        _data.insert(_data.begin() + pos, std::move(value));
        return true;
    }

    bool contains(const std::string& value) const{
        std::size_t pos = lowerBound(value);
        return (pos < _data.size() && _data[pos] == value);
    }

    bool remove(const std::string& value){
        std::size_t pos = lowerBound(value);
        if (pos < _data.size() && _data[pos] == value)
        {
            _data.erase(_data.begin() + pos);
            return true;
        }
        return false;
    }

    std::size_t size() const noexcept {return _data.size();}
    bool empty() const noexcept { return _data.empty(); }
    void clear() noexcept{_data.clear();}


    auto begin() const { return _data.begin(); }  
    auto end() const { return _data.end(); }
  
};
